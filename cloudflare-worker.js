const ALLOWED_ORIGINS = ["https://peterhegg.github.io", "http://localhost:5173"];
const LOCKED_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS_LIMIT = 1000;
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;
const MAX_SYSTEM_LENGTH = 6000;
const RATE_LIMIT_PER_MINUTE = 20;

// claude-sonnet-4: $3/MTok input, $15/MTok output
const COST_PER_INPUT_TOKEN = 3 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000;
const DAILY_BUDGET_USD = 1.00;

function todayKey() {
  return `budget:${new Date().toISOString().slice(0, 10)}`;
}

async function checkBudget(env) {
  const spent = parseFloat((await env.RATE_LIMIT_KV.get(todayKey())) || "0");
  return spent < DAILY_BUDGET_USD;
}

// NOTE: checkBudget + recordCost are non-atomic (KV has no transactions).
// Two simultaneous requests near the budget limit could each pass the check
// and together slightly exceed DAILY_BUDGET_USD. Accepted as best-effort
// given the small budget size.
async function recordCost(env, inputTokens, outputTokens) {
  const key = todayKey();
  const spent = parseFloat((await env.RATE_LIMIT_KV.get(key)) || "0");
  const cost = inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;
  await env.RATE_LIMIT_KV.put(key, String(spent + cost), { expirationTtl: 90000 }); // ~25 hours
}

// NOTE: checkRateLimit is non-atomic — simultaneous requests from the same IP
// could each read the same count and both increment, allowing brief bursts
// slightly above RATE_LIMIT_PER_MINUTE. Accepted as best-effort.
async function checkRateLimit(env, ip) {
  const key = `rl:${ip}`;
  const count = parseInt((await env.RATE_LIMIT_KV.get(key)) || "0");
  if (count >= RATE_LIMIT_PER_MINUTE) return false;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (!await checkBudget(env)) {
      return new Response(JSON.stringify({ error: "Daily budget reached. Try again tomorrow." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "86400" },
      });
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!await checkRateLimit(env, ip)) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: { ...corsHeaders, "Retry-After": "60" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    const safeBody = {
      model: LOCKED_MODEL,
      max_tokens: Math.min(
        Number.isInteger(body.max_tokens) ? body.max_tokens : 800,
        MAX_TOKENS_LIMIT
      ),
      system: typeof body.system === "string"
        ? body.system.slice(0, MAX_SYSTEM_LENGTH)
        : "",
      messages: Array.isArray(body.messages)
        ? body.messages.slice(-MAX_MESSAGES).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: typeof m.content === "string"
              ? m.content.slice(0, MAX_CONTENT_LENGTH)
              : "",
          }))
        : [],
    };

    if (safeBody.messages.length === 0) {
      return new Response("Bad Request", { status: 400, headers: corsHeaders });
    }

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(safeBody),
      });
    } catch {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok && response.status >= 500) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid upstream response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.usage) {
      await recordCost(env, data.usage.input_tokens ?? 0, data.usage.output_tokens ?? 0);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
