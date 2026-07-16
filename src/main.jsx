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
// manifest. Reload once when that handover happens so the tab picks up the
// matching build instead of silently running stale code.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
