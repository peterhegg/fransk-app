import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import worker from "./cloudflare-worker.js";

const ORIGIN = "https://peterhegg.github.io";

function makeKV() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v); },
    delete: async (k) => { m.delete(k); },
    list: async ({ prefix = "" } = {}) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
    _m: m,
  };
}

const ctx = { waitUntil: (p) => p };
const makeEnv = (kv = makeKV()) => ({ CLIENT_TOKEN: "tok", ANTHROPIC_API_KEY: "key", RATE_LIMIT_KV: kv });
const post = (path, body, headers = {}) => new Request(`https://w.example${path}`, {
  method: "POST",
  headers: { Origin: ORIGIN, "X-App-Token": "tok", "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
});

let upstream;
beforeEach(() => {
  upstream = vi.fn(async () => new Response(JSON.stringify({
    content: [{ type: "text", text: JSON.stringify({ reply: "Hallo!", correction: null }) }],
    usage: { input_tokens: 10, output_tokens: 5 },
  }), { status: 200 }));
  vi.stubGlobal("fetch", upstream);
});
afterEach(() => vi.unstubAllGlobals());

describe("access control", () => {
  it("rejects unknown origins", async () => {
    const res = await worker.fetch(new Request("https://w.example/voice", { method: "POST", headers: { Origin: "https://evil.example" }, body: "{}" }), makeEnv(), ctx);
    expect(res.status).toBe(403);
  });
  it("rejects a wrong token", async () => {
    const res = await worker.fetch(post("/voice", {}, { "X-App-Token": "nope" }), makeEnv(), ctx);
    expect(res.status).toBe(403);
  });
  it("answers preflight with a max-age", async () => {
    const res = await worker.fetch(new Request("https://w.example/voice", { method: "OPTIONS", headers: { Origin: ORIGIN } }), makeEnv(), ctx);
    expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
  });
});

describe("/voice", () => {
  it("uses the German prompt for de-CH and the French one otherwise", async () => {
    await worker.fetch(post("/voice", { userMessage: "Hallo", history: [], language: "de-CH" }), makeEnv(), ctx);
    expect(JSON.parse(upstream.mock.calls[0][1].body).system).toContain("Schweizer Hochdeutsch");
    await worker.fetch(post("/voice", { userMessage: "Bonjour", history: [] }), makeEnv(), ctx);
    expect(JSON.parse(upstream.mock.calls[1][1].body).system).toContain("française");
  });
  it("rejects empty messages", async () => {
    const res = await worker.fetch(post("/voice", { userMessage: "  " }), makeEnv(), ctx);
    expect(res.status).toBe(400);
  });
});

describe("rate limiting", () => {
  it("returns 429 after the per-minute cap and does not touch upstream", async () => {
    const env = makeEnv();
    let last;
    for (let i = 0; i < 21; i++) last = await worker.fetch(post("/voice", { userMessage: "Hi" }, { "CF-Connecting-IP": "1.2.3.4" }), env, ctx);
    expect(last.status).toBe(429);
    expect(upstream).toHaveBeenCalledTimes(20);
  });
  it("does not crash when KV reads throw", async () => {
    const kv = makeKV();
    kv.get = async () => { throw new Error("kv down"); };
    const res = await worker.fetch(post("/voice", { userMessage: "Hi" }), makeEnv(kv), ctx);
    expect(res.status).toBe(200);
  });
});

describe("push subscribe", () => {
  const sub = (endpoint) => ({ endpoint, keys: { p256dh: "a", auth: "b" }, scheduledTime: "07:00" });
  it("rejects endpoints that are not real push services", async () => {
    const res = await worker.fetch(post("/push/subscribe", sub("https://evil.example/x")), makeEnv(), ctx);
    expect(res.status).toBe(400);
  });
  it("stores only validated fields for an FCM endpoint", async () => {
    const kv = makeKV();
    const res = await worker.fetch(post("/push/subscribe", { ...sub("https://fcm.googleapis.com/fcm/send/abc"), junk: "x", scheduledTime: "07:30" }), makeEnv(kv), ctx);
    expect(res.status).toBe(200);
    const stored = JSON.parse([...kv._m.values()][0]);
    expect(stored.scheduledTime).toBe("20:00"); // 07:30 is not an on-the-hour slot
    expect(stored.junk).toBeUndefined();
  });
});

describe("malformed input", () => {
  it("ignores null entries in history and messages", async () => {
    const res = await worker.fetch(post("/voice", { userMessage: "Hi", history: [null, { role: "user", content: "a" }] }), makeEnv(), ctx);
    expect(res.status).toBe(200);
    const res2 = await worker.fetch(post("/", { messages: [null, { role: "user", content: "x" }] }), makeEnv(), ctx);
    expect(res2.status).toBe(200);
  });
});
