import "./storage-namespace.js"; // MUST be first — namespaces localStorage before any app module reads it
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "framer-motion";
import "./design-system.css";
// Self-hosted fonts (precached by the service worker → work offline).
import "@fontsource/dm-sans/latin-300.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-400-italic.css";
import "@fontsource/playfair-display/latin-500.css";
import "@fontsource/playfair-display/latin-500-italic.css";
import "@fontsource/spectral/latin-400.css";
import "@fontsource/spectral/latin-400-italic.css";
import "@fontsource/spectral/latin-500-italic.css";
import "@fontsource-variable/lexend/wght.css";
import App from "./App.jsx";
import ErrorBoundary, { installGlobalErrorLog } from "./components/ErrorBoundary.jsx";
import { loadActiveLangId } from "./languages/index.js";
import { loadUserProfile, applyReadingMode } from "./utils.jsx";

// Theme the document for the active language (CSS [data-lang="…"]).
document.documentElement.setAttribute("data-lang", loadActiveLangId());
applyReadingMode(loadUserProfile().readingMode);

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

installGlobalErrorLog();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<div style={{ minHeight: "100dvh", background: "var(--app-bg, var(--bg))" }} />}>
          <App />
        </Suspense>
      </MotionConfig>
    </ErrorBoundary>
  </React.StrictMode>
);
