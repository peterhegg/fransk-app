import { useState, useCallback } from "react";

const KEY = "fransk-tutor-prefs";

const DEFAULTS = {
  tutorPersona: "henri",
  tutorName: "Henri",
  tutorVisibility: "all",
};

export function loadTutorPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveTutorPrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
}

export function useTutorPrefs() {
  const [prefs, setPrefs] = useState(loadTutorPrefs);
  const updatePrefs = useCallback((updates) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      saveTutorPrefs(next);
      return next;
    });
  }, []);
  return [prefs, updatePrefs];
}

export function tutorVisible(prefs) {
  return prefs.tutorVisibility !== "hidden";
}
