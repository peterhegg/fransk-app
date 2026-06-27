// ── Language registry ────────────────────────────────────────────────────
// Single source of truth for which languages exist and which one is active.
// Each module exports a LangConfig (see fr.js for the contract). Screens read
// the active language's config instead of importing French constants directly
// (wired up in a later phase).
import { useState, useCallback } from "react";
import fr from "./fr.js";
import deCH from "./de-ch.js";

// id → LangConfig.
export const LANGUAGES = {
  fr,
  "de-CH": deCH,
};

export const DEFAULT_LANG = "fr";
export const ACTIVE_LANG_KEY = "sprakappen-lang";

export function loadActiveLangId() {
  try {
    const id = localStorage.getItem(ACTIVE_LANG_KEY);
    return id && LANGUAGES[id] ? id : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

// Non-hook accessor for module-level / event-handler use.
export function getActiveLang() {
  return LANGUAGES[loadActiveLangId()];
}

export function useLang() {
  const [langId, setLangId] = useState(loadActiveLangId);
  const setLang = useCallback((id) => {
    if (!LANGUAGES[id]) return;
    try {
      localStorage.setItem(ACTIVE_LANG_KEY, id);
    } catch {}
    setLangId(id);
  }, []);
  return [LANGUAGES[langId], setLang, langId];
}
