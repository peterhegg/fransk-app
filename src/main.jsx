import "./storage-namespace.js"; // MUST be first — namespaces localStorage before any app module reads it
import React from "react";
import ReactDOM from "react-dom/client";
import "./design-system.css";
import App from "./App.jsx";
import { loadActiveLangId } from "./languages/index.js";

// Theme the document for the active language (CSS [data-lang="…"]).
document.documentElement.setAttribute("data-lang", loadActiveLangId());

// The service worker calls skipWaiting()/clients.claim() immediately on
// update, which detaches an already-open tab's JS from the new precache
// manifest. Reload when that handover happens so the tab picks up the
// matching build — but never on a first install (no previous controller;
// that would wipe onboarding) and never while the user is mid-exercise
// (wait until the app is backgrounded).
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true;
    if (document.visibilityState === "hidden") {
      window.location.reload();
      return;
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") window.location.reload();
    });
  });
}

// Ask the browser not to evict localStorage under storage pressure.
try { navigator.storage?.persist?.(); } catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
