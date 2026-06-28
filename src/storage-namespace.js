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

  const wrapped = {
    getItem: (k) => real.getItem(nk(k)),
    setItem: (k, v) => real.setItem(nk(k), v),
    removeItem: (k) => real.removeItem(nk(k)),
    clear: () => real.clear(),
    key: (i) => real.key(i),
    get length() { return real.length; },
  };

  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { return wrapped; },
    });
  } catch {
    // If the host forbids redefining window.localStorage, isolation is lost
    // but the app still works on the default store.
  }
}
