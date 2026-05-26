const PROD_ORIGIN = "https://peterhegg.github.io";
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
    const errBody = await response.text().catch(() => "");
    console.error(`Anthropic error ${response.status}:`, errBody.slice(0, 500));
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

// ── Web Push helpers ─────────────────────────────────────────────────────

function b64urlDecode(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad), c => c.charCodeAt(0));
}

function b64urlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

async function hkdf(ikm, salt, info, length) {
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoBytes = typeof info === "string" ? new TextEncoder().encode(info) : info;
  const T = concat(infoBytes, new Uint8Array([1]));
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, T));
  return okm.slice(0, length);
}

async function makeVapidJwt(endpoint, env) {
  const audience = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 43200;
  const toB64 = obj => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const unsignedToken = `${toB64({ typ: "JWT", alg: "ES256" })}.${toB64({ aud: audience, exp, sub: "mailto:peter@subjekt.no" })}`;
  const pubBytes = b64urlDecode(env.VAPID_PUBLIC_KEY);
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: env.VAPID_PRIVATE_KEY, x: b64urlEncode(pubBytes.slice(1, 33)), y: b64urlEncode(pubBytes.slice(33, 65)) },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, privateKey, new TextEncoder().encode(unsignedToken)));
  return `vapid t=${unsignedToken}.${b64urlEncode(sig)},k=${env.VAPID_PUBLIC_KEY}`;
}

async function encryptPushPayload(payloadObj, sub) {
  const uaPub = b64urlDecode(sub.keys.p256dh);
  const authSecret = b64urlDecode(sub.keys.auth);
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));

  const ephemeralPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const rawEphPub = new Uint8Array(await crypto.subtle.exportKey("raw", ephemeralPair.publicKey));
  const uaPubKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedBits = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaPubKey }, ephemeralPair.privateKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyInfo = concat(new TextEncoder().encode("WebPush: info\x00"), uaPub, rawEphPub);
  const prkKey = await hkdf(sharedBits, authSecret, keyInfo, 32);
  const cek = await hkdf(prkKey, salt, "Content-Encoding: aes128gcm\x00", 16);
  const nonce = await hkdf(prkKey, salt, "Content-Encoding: nonce\x00", 12);

  const record = concat(new Uint8Array([0, 0]), payloadBytes, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, record));

  const hdr = new Uint8Array(21 + rawEphPub.length);
  hdr.set(salt, 0);
  new DataView(hdr.buffer).setUint32(16, 4096, false);
  hdr[20] = rawEphPub.length;
  hdr.set(rawEphPub, 21);

  return concat(hdr, ciphertext);
}

async function sendPush(sub, payload, env) {
  const body = await encryptPushPayload(payload, sub);
  const auth = await makeVapidJwt(sub.endpoint, env);
  return fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": auth,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body,
  });
}

async function handlePushSubscribe(body, env, corsHeaders) {
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return new Response("Bad subscription", { status: 400, headers: corsHeaders });
  }
  const key = `push:sub:${b64urlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body.endpoint))))}`;
  await env.RATE_LIMIT_KV.put(key, JSON.stringify(body), { expirationTtl: 60 * 60 * 24 * 90 });
  return new Response("OK", { status: 200, headers: corsHeaders });
}

async function handlePushUnsubscribe(body, env, corsHeaders) {
  if (!body?.endpoint) return new Response("Bad request", { status: 400, headers: corsHeaders });
  const key = `push:sub:${b64urlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body.endpoint))))}`;
  await env.RATE_LIMIT_KV.delete(key);
  return new Response("OK", { status: 200, headers: corsHeaders });
}

// ── Scheduled handler (runs at 20:00 UTC = 22:00 Norway) ─────────────────

async function sendStreakReminders(env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  const list = await env.RATE_LIMIT_KV.list({ prefix: "push:sub:" });
  const payload = {
    title: "L'Atelier",
    body: "Dagens øvelse venter — quelques minutes suffit.",
    icon: "/fransk-app/icon-192.png",
  };
  for (const key of list.keys) {
    const raw = await env.RATE_LIMIT_KV.get(key.name);
    if (!raw) continue;
    try {
      const sub = JSON.parse(raw);
      await sendPush(sub, payload, env);
    } catch (e) {
      console.error("Push failed for", key.name, e);
    }
  }
}

// ── Widget ────────────────────────────────────────────────────────────────────

async function handleWidgetSync(body, env, corsHeaders) {
  const { uuid, streak, todayAnswers, dailyGoal, dagensDone } = body || {};
  if (!uuid || !/^[a-f0-9]{24}$/.test(uuid)) {
    return new Response("Bad request", { status: 400, headers: corsHeaders });
  }
  const data = {
    streak: Math.max(0, parseInt(streak) || 0),
    todayAnswers: Math.max(0, parseInt(todayAnswers) || 0),
    dailyGoal: Math.max(1, parseInt(dailyGoal) || 20),
    dagensDone: !!dagensDone,
    updatedAt: Date.now(),
  };
  await env.RATE_LIMIT_KV.put(`widget:${uuid}`, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 14 });
  return new Response("OK", { status: 200, headers: corsHeaders });
}

const APP_URL = "https://peterhegg.github.io/fransk-app/";

async function handleWidgetPage(uuid, env) {
  let data = null;
  try {
    const raw = await env.RATE_LIMIT_KV.get(`widget:${uuid}`);
    if (raw) data = JSON.parse(raw);
  } catch {}

  // No data yet — show setup prompt
  if (!data) {
    const html = `<!DOCTYPE html>
<html lang="no"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta http-equiv="refresh" content="60">
<title>L'Atelier</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
body{background:#0e0b08;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:16px;gap:8px;cursor:pointer}
.ico{font-size:32px}
.lbl{font-size:12px;color:rgba(240,230,208,.5);text-align:center;line-height:1.5}
.btn{font-size:11px;color:#e6d3a8;border:1px solid rgba(230,211,168,.3);border-radius:8px;padding:6px 14px;margin-top:4px}
</style>
</head>
<body onclick="window.location.href='${APP_URL}'">
<div class="ico">📱</div>
<div class="lbl">Åpne L'Atelier-appen<br>for å aktivere widgeten</div>
<div class="btn">Åpne appen</div>
</body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" } });
  }

  const pct = Math.min(100, (data.todayAnswers / data.dailyGoal) * 100);
  const goalReached = data.todayAnswers >= data.dailyGoal;
  const barColor = goalReached ? "#e6d3a8" : "#5e9a6f";
  const statusIcon = goalReached ? "🏆" : data.dagensDone ? "📚" : "💪";
  const dagensText = data.dagensDone ? "✓ Dagens glose fullført" : "○ Dagens glose venter";
  const dagensColor = data.dagensDone ? "#5e9a6f" : "rgba(240,230,208,0.35)";
  const updMin = data.updatedAt ? Math.round((Date.now() - data.updatedAt) / 60000) : null;
  const updTxt = updMin === null ? "" : updMin < 2 ? "nå nettopp" : updMin < 60 ? `${updMin} min siden` : `${Math.round(updMin/60)}t siden`;

  const html = `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta http-equiv="refresh" content="600">
<title>L'Atelier</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
a{text-decoration:none;color:inherit;display:flex;flex-direction:column;justify-content:center;align-items:center;width:100%;height:100%;padding:14px;gap:5px}
body{background:#0e0b08;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.name{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(240,230,208,.3);margin-bottom:1px}
.streak-row{display:flex;align-items:center;gap:5px}
.snum{font-size:52px;font-weight:800;color:#f59e0b;line-height:1;letter-spacing:-2px}
.sico{font-size:26px;line-height:1}
.slbl{font-size:10px;color:rgba(240,230,208,.4);text-transform:uppercase;letter-spacing:1.2px}
.div{width:36px;height:1px;background:rgba(255,255,255,.1)}
.prog{width:100%;max-width:190px}
.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}
.atxt{font-size:13px;font-weight:700;color:#f0e6d0}
.stxt{font-size:10px;color:rgba(240,230,208,.4)}
.bar{height:4px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden}
.fill{height:100%;border-radius:2px}
.drow{display:flex;align-items:center;gap:5px;margin-top:4px}
.ddot{width:6px;height:6px;border-radius:50%}
.dtxt{font-size:10px;color:rgba(240,230,208,.4)}
.upd{font-size:8px;color:rgba(240,230,208,.2);margin-top:3px}
</style>
</head>
<body>
<a href="${APP_URL}" target="_top">
<div class="name">L'Atelier</div>
<div class="streak-row">
  <div class="snum">${data.streak}</div>
  <div class="sico">🔥</div>
</div>
<div class="slbl">dagers streak</div>
<div class="div"></div>
<div class="prog">
  <div class="ph">
    <span class="atxt">${data.todayAnswers} / ${data.dailyGoal}</span>
    <span class="stxt">${statusIcon}</span>
  </div>
  <div class="bar"><div class="fill" style="width:${pct}%;background:${barColor}"></div></div>
  <div class="drow">
    <div class="ddot" style="background:${dagensColor}"></div>
    <span class="dtxt">${dagensText}</span>
  </div>
</div>
${updTxt ? `<div class="upd">${updTxt}</div>` : ""}
</a>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default {
  async scheduled(event, env) {
    await sendStreakReminders(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Widget page: public GET, no auth or origin check needed
    if (request.method === "GET") {
      const m = pathname.match(/^\/widget\/([a-f0-9]{24})$/);
      if (m) return handleWidgetPage(m[1], env);
      return new Response("Not Found", { status: 404 });
    }

    const allowedOrigins = [PROD_ORIGIN];
    if (env.DEV_ORIGIN) allowedOrigins.push(env.DEV_ORIGIN);
    const origin = request.headers.get("Origin") || "";

    if (!allowedOrigins.includes(origin)) {
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

    const token = request.headers.get("X-App-Token");
    if (!env.CLIENT_TOKEN || token !== env.CLIENT_TOKEN) {
      return new Response("Forbidden", { status: 403 });
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

    // Route dispatch
    if (pathname === "/push/subscribe") return handlePushSubscribe(body, env, corsHeaders);
    if (pathname === "/push/unsubscribe") return handlePushUnsubscribe(body, env, corsHeaders);
    if (pathname === "/widget/sync") return handleWidgetSync(body, env, corsHeaders);
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
