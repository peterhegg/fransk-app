const ALLOWED_ORIGINS = ["https://peterhegg.github.io", "http://localhost:5173"];
const LOCKED_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_LIMIT = 1000;
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;
const MAX_SYSTEM_LENGTH = 6000;
const RATE_LIMIT_PER_MINUTE = 20;
const DAILY_IP_LIMIT = 200;

const COST_PER_INPUT_TOKEN = 3 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000;
const DAILY_BUDGET_USD = 1.00;

const VOICE_SYSTEM = `Tu es un partenaire de conversation française chaleureux et encourageant.
Mène une conversation naturelle et fluide entièrement en français.
Garde tes réponses à 2-4 phrases pour que la conversation reste dynamique.
Pose des questions de suivi pour maintenir le dialogue.

Adapte ta complexité au niveau apparent de l'utilisateur :
- Beaucoup d'erreurs + vocabulaire simple → utilise le présent, des mots courants
- Erreurs occasionnelles + temps mélangés → introduis le subjonctif et des expressions idiomatiques naturellement
- Structures complexes + peu d'erreurs → réponds de même, utilise un vocabulaire nuancé

Si le dernier message de l'utilisateur contenait une erreur de grammaire ou de vocabulaire, inclus une correction.
Ne corrige qu'une seule erreur, la plus importante. Sois bref et bienveillant, en français.
Si le message était correct, mets correction à null.

Réponds UNIQUEMENT avec du JSON valide, sans markdown :
{"reply":"ta réponse en français","correction":{"original":"la partie incorrecte","corrected":"la version correcte","explanation":"courte explication en français"}}
ou si aucune correction :
{"reply":"ta réponse en français","correction":null}`;

function todayKey() {
  return `budget:${new Date().toISOString().slice(0, 10)}`;
}

async function checkBudget(env) {
  const spent = parseFloat((await env.RATE_LIMIT_KV.get(todayKey())) || "0");
  return spent < DAILY_BUDGET_USD;
}

async function recordCost(env, inputTokens, outputTokens) {
  const key = todayKey();
  const spent = parseFloat((await env.RATE_LIMIT_KV.get(key)) || "0");
  const cost = inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;
  await env.RATE_LIMIT_KV.put(key, String(spent + cost), { expirationTtl: 90000 });
}

async function checkRateLimit(env, ip) {
  const key = `rl:${ip}`;
  const count = parseInt((await env.RATE_LIMIT_KV.get(key)) || "0");
  if (count >= RATE_LIMIT_PER_MINUTE) return false;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}

async function checkDailyIPLimit(env, ip) {
  const key = `daily:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt((await env.RATE_LIMIT_KV.get(key)) || "0");
  if (count >= DAILY_IP_LIMIT) return false;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 90000 });
  return true;
}

async function handleVoice(body, env, corsHeaders) {
  const { history, userMessage } = body;

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .slice(-18)
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: typeof m.content === "string" ? m.content.slice(0, 500) : "",
        }))
        .filter(m => m.content)
    : [];

  const messages = [
    ...safeHistory,
    { role: "user", content: userMessage.trim().slice(0, 500) },
  ];

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: LOCKED_MODEL,
        max_tokens: 400,
        system: VOICE_SYSTEM,
        messages,
      }),
    });
  } catch {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Upstream error" }), {
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

  const rawText = data.content?.[0]?.text || "";
  let reply = rawText;
  let correction = null;

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.reply) {
        reply = parsed.reply;
        correction = parsed.correction || null;
      }
    }
  } catch {
    // use rawText as reply with no correction
  }

  return new Response(JSON.stringify({ reply, correction }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
      "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (env.CLIENT_TOKEN && request.headers.get("X-App-Token") !== env.CLIENT_TOKEN) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
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

    if (!await checkDailyIPLimit(env, ip)) {
      return new Response("Daily limit reached for this IP. Try again tomorrow.", {
        status: 429,
        headers: { ...corsHeaders, "Retry-After": "86400" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    // Route: /voice for real-time voice conversation
    const pathname = new URL(request.url).pathname;
    if (pathname === "/voice") {
      return handleVoice(body, env, corsHeaders);
    }

    // Default: general Claude proxy
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
