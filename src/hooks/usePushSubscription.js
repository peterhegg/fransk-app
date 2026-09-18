import { useState, useEffect, useCallback } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { loadUserProfile, getOrCreateWidgetUUID } from "../utils.jsx";
import { brand } from "../content.js";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const STORAGE_KEY = "fransk-push-enabled";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// POSTs the subscription with the current reminder time. Called on subscribe,
// on app start (refreshes the server-side 90-day TTL) and after profile saves
// (so a changed reminder time actually reaches the server).
async function postSubscription(sub) {
  await fetch(`${PROXY_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
    body: JSON.stringify({
      ...sub.toJSON(),
      scheduledTime: loadUserProfile().pushTime || "20:00",
      widgetUuid: getOrCreateWidgetUUID(),
      brand,
    }),
  });
}

export async function syncPushSubscription() {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== "true" || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await postSubscription(sub);
  } catch {}
}

export function usePushSubscription() {
  const [error, setError] = useState(null);
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [loading, setLoading] = useState(false);
  const supported = "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC_KEY;

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await postSubscription(sub);
      localStorage.setItem(STORAGE_KEY, "true");
      setEnabled(true);
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setError(err?.name === "NotAllowedError"
        ? "Varsler er blokkert. Tillat varsler for appen i telefonens innstillinger."
        : "Kunne ikke slå på påminnelser. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`${PROXY_URL}/push/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      localStorage.removeItem(STORAGE_KEY);
      setEnabled(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (enabled) unsubscribe();
    else subscribe();
  }, [enabled, subscribe, unsubscribe]);

  useEffect(() => {
    if (!supported || !enabled) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (!sub) {
          localStorage.removeItem(STORAGE_KEY);
          setEnabled(false);
        } else {
          postSubscription(sub).catch(() => {});
        }
      })
    );
  }, []);

  return { enabled, loading, supported, error, toggle };
}
