import "./storage-namespace.js"; // MUST be first — namespaces localStorage before any app module reads it
import React from "react";
import ReactDOM from "react-dom/client";
import "./design-system.css";
import App from "./App.jsx";
import { loadActiveLangId } from "./languages/index.js";

// Theme the document for the active language (CSS [data-lang="…"]).
document.documentElement.setAttribute("data-lang", loadActiveLangId());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
