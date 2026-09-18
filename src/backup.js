import { rawStorage } from "./storage-namespace.js";

const BACKUP_APP = "sprakappen";
const BACKUP_VERSION = 1;
// Device-level keys that must not travel between devices.
const EXCLUDED_KEYS = new Set(["fransk-widget-uuid", "fransk-push-enabled"]);

function localDateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function exportBackup() {
  if (!rawStorage) throw new Error("no-storage");
  const data = {};
  for (let i = 0; i < rawStorage.length; i++) {
    const k = rawStorage.key(i);
    if (k && !EXCLUDED_KEYS.has(k)) data[k] = rawStorage.getItem(k);
  }
  const payload = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sprakappen-backup-${localDateStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return Object.keys(data).length;
}

// Parses and validates a backup file's text. Returns the key/value map.
export function parseBackup(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error("invalid-json"); }
  if (!parsed || parsed.app !== BACKUP_APP || typeof parsed.data !== "object" || parsed.data === null) {
    throw new Error("not-a-backup");
  }
  const entries = Object.entries(parsed.data);
  if (entries.some(([, v]) => typeof v !== "string")) throw new Error("not-a-backup");
  return Object.fromEntries(entries.filter(([k]) => !EXCLUDED_KEYS.has(k)));
}

export function restoreBackup(data) {
  if (!rawStorage) throw new Error("no-storage");
  for (const [k, v] of Object.entries(data)) rawStorage.setItem(k, v);
  return Object.keys(data).length;
}
