// localStorage namespacing per language — the heart of language isolation.
//
// Imported FIRST in main.jsx (before App), so the wrapper is installed before
// any module-level localStorage read runs (e.g. ChatScreen reads user profile
// at import time). ESM evaluates imports in source order, so a bare
// `import "./storage-namespace.js"` placed above `import App` guarantees this.
//
// Strategy: the default language (French) keeps its existing "fransk-*" keys
// untouched — zero behaviour change, existing data preserved. Any other
// language transparently prefixes every app key with "<langId>:", giving each
// language a fully isolated store (words, streak, grammar, tutor prefs, ...).
// Switching language triggers a full reload (see useLang), so the active
// namespace is fixed for the page lifetime.
import { loadActiveLangId, DEFAULT_LANG } from "./languages/index.js";

// Keys that must stay global (shared across all languages).
const GLOBAL_KEYS = new Set(["sprakappen-lang", "theme"]);

const langId = loadActiveLangId();

if (langId !== DEFAULT_LANG && typeof window !== "undefined" && window.localStorage) {
  const real = window.localStorage;
  const ns = langId + ":";
  const nk = (k) => (GLOBAL_KEYS.has(k) ? k : ns + k);

  // A Proxy over the real Storage: getItem/setItem/removeItem are namespaced,
  // everything else (length, key, clear, enumeration) passes through to the
  // real object — so Object.keys/for-in still behave like a real Storage.
  const proxy = new Proxy(real, {
    get(target, prop) {
      if (prop === "getItem") return (k) => target.getItem(nk(k));
      if (prop === "setItem") return (k, v) => target.setItem(nk(k), v);
      if (prop === "removeItem") return (k) => target.removeItem(nk(k));
      const v = target[prop];
      return typeof v === "function" ? v.bind(target) : v;
    },
  });

  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { return proxy; },
    });
  } catch {
    // If the host forbids redefining window.localStorage, isolation is lost
    // but the app still works on the default store.
  }
}
