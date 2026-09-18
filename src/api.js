import { PROXY_URL, APP_TOKEN } from "./constants.js";

const DEFAULT_TIMEOUT_MS = 45000;

// POSTs a Claude request body to the Worker proxy. Returns the raw Response so
// callers keep their own parsing. Adds the app token and a timeout (with the
// caller's optional AbortSignal honoured) in one place.
export function proxyFetch(body, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  return fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
    signal: controller.signal,
    body: JSON.stringify(body),
  }).finally(() => {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  });
}

// Worker errors are `{ error: "text" }`; Anthropic's own are `{ error: { message } }`.
export function apiErrorText(data, status) {
  const raw = typeof data?.error === "string" ? data.error : data?.error?.message || "";
  const low = raw.toLowerCase();
  if (status === 429 || low.includes("budget") || low.includes("daily")) {
    return low.includes("too many")
      ? "For mange forespørsler på kort tid. Vent litt og prøv igjen."
      : "Daglig grense er nådd. Appen åpner igjen ved midnatt (norsk tid).";
  }
  if (status === 403) return "Ingen tilgang til tjenesten. Appen må oppdateres.";
  if (status >= 500) return "Tjenesten er midlertidig nede. Prøv igjen om litt.";
  return "Noe gikk galt. Prøv igjen.";
}
