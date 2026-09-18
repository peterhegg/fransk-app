import { Component } from "react";

const LOG_KEY = "sprakappen-error-log";
const MAX_ENTRIES = 20;

// Small persistent ring buffer so a crash can be inspected after the reload.
export function logError(kind, err) {
  try {
    const entry = {
      t: new Date().toISOString(),
      kind,
      msg: String(err?.message || err).slice(0, 300),
      stack: String(err?.stack || "").slice(0, 800),
    };
    const list = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    list.push(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {}
}

export function installGlobalErrorLog() {
  window.addEventListener("error", (e) => logError("error", e.error || e.message));
  window.addEventListener("unhandledrejection", (e) => logError("rejection", e.reason));
}

export default class ErrorBoundary extends Component {
  state = { error: null, copied: false };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    logError("render", error);
  }

  copyDiagnostics = () => {
    let text = "";
    try { text = localStorage.getItem(LOG_KEY) || String(this.state.error); } catch { text = String(this.state.error); }
    navigator.clipboard?.writeText(text).then(() => this.setState({ copied: true })).catch(() => {});
  };

  render() {
    if (!this.state.error) return this.props.children;
    const btn = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 20px", color: "var(--text)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" };
    return (
      <div role="alert" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center", background: "var(--app-bg, var(--bg))", color: "var(--text)", fontFamily: "var(--font-body)" }}>
        <div style={{ fontSize: 40 }}>😕</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Noe gikk galt</div>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", maxWidth: 300, lineHeight: 1.6 }}>
          Ordene og fremgangen din er trygt lagret. Last appen på nytt.
        </div>
        <button onClick={() => window.location.reload()} style={btn}>Last inn på nytt</button>
        <button onClick={this.copyDiagnostics} style={{ ...btn, fontSize: 12, color: "var(--text-subtle)" }}>
          {this.state.copied ? "✓ Kopiert" : "Kopier feilinfo"}
        </button>
      </div>
    );
  }
}
