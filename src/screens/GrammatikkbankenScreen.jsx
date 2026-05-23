import { useState } from "react";
import { MASTERY_LABELS, MASTERY_COLORS, SR_INTERVALS, MASTERY_POINTS, GRAMMAR_TOPICS } from "../constants.js";
import { getWordTier } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

function GrammarWordCard({ w }) {
  const pts = w.points || 0;
  const tier = getWordTier(pts);
  const isMastered = tier === 5;
  return (
    <div style={{ background: "var(--surface)", border: `1px solid ${isMastered ? "rgba(230,211,168,0.4)" : "var(--border)"}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontStyle: "italic", color: "var(--text)" }}>{w.fr}</span>
        {w.no && <span style={{ color: "var(--text-subtle)", fontSize: 13 }}> = {w.no}</span>}
        {w.phonetic && <span style={{ color: "var(--text-muted)", fontSize: 12 }}> ({w.phonetic})</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0, marginLeft: 8 }}>
        <div style={{ fontSize: 10, color: isMastered ? "var(--cream)" : MASTERY_COLORS[tier], letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: isMastered ? "bold" : "normal" }}>
          {isMastered ? "★ mestret" : MASTERY_LABELS[tier]}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-subtle)", letterSpacing: 0.5 }}>{pts} / {MASTERY_POINTS} pts</div>
      </div>
    </div>
  );
}

export default function GrammatikkbankenScreen({ grammarWords, setGrammarWords, onBack, onClearGrammar, screen, showWords, onNav }) {
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [closedSections, setClosedSections] = useState(new Set());

  const toggleSection = (id) => setClosedSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const grammarByTopic = GRAMMAR_TOPICS
    .map(topic => ({
      topic,
      words: grammarWords.filter(w => w.topicId === topic.id),
    }))
    .filter(g => g.words.length > 0);

  const ungroupedGrammar = grammarWords.filter(w => !GRAMMAR_TOPICS.some(t => t.id === w.topicId));

  const copyGrammarWords = () => {
    if (!grammarWords.length) return;
    navigator.clipboard.writeText(
      "Mine franske grammatikkord:\n" +
      grammarWords.map(w => {
        const pts = w.points || 0;
        const topic = w.topicId ? ` [topic:${w.topicId}]` : "";
        return `◐ ${w.fr}${w.no ? ` = ${w.no}` : ""}${w.phonetic ? ` (${w.phonetic})` : ""} [pts:${pts}]${topic}`;
      }).join("\n")
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const importGrammarWords = () => {
    if (!setGrammarWords) return;
    const lines = importText.split("\n").map(l => l.trim()).filter(Boolean);
    let added = 0, updated_count = 0;
    setGrammarWords(prev => {
      let updated = [...prev];
      for (const line of lines) {
        const clean = line.replace(/^[◐✓✗•\-*]\s*/, "").trim();
        const eqIdx = clean.indexOf(" = ");
        if (eqIdx === -1) continue;
        const fr = clean.slice(0, eqIdx).trim();
        if (!fr) continue;
        let rest = clean.slice(eqIdx + 3).trim();
        const topicMatch = rest.match(/\[topic:([^\]]+)\]\s*$/);
        const importedTopic = topicMatch ? topicMatch[1].trim() : null;
        if (topicMatch) rest = rest.slice(0, topicMatch.index).trim();
        const ptsMatch = rest.match(/\[pts:([\d.]+)\]\s*$/);
        const importedPoints = ptsMatch ? parseFloat(ptsMatch[1]) : null;
        if (ptsMatch) rest = rest.slice(0, ptsMatch.index).trim();
        const pm = rest.match(/\(([^)]+)\)\s*$/);
        const phonetic = pm ? pm[1].trim() : "";
        const no = pm ? rest.slice(0, pm.index).trim() : rest;
        const existing = updated.find(w => w.fr === fr);
        if (existing) {
          if (importedPoints !== null || importedTopic !== null) {
            updated = updated.map(w => {
              if (w.fr !== fr) return w;
              const patch = {};
              if (importedPoints !== null) patch.points = importedPoints;
              if (importedTopic !== null) patch.topicId = importedTopic;
              return { ...w, ...patch };
            });
            updated_count++;
          }
          continue;
        }
        const topicProp = importedTopic ? { topicId: importedTopic } : {};
        updated.push({ id: Date.now() + Math.random(), fr, no, phonetic, level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now(), points: importedPoints ?? 0, ...topicProp });
        added++;
      }
      return updated;
    });
    const total = added + updated_count;
    setImportResult({ added, updated: updated_count });
    if (total > 0) { setImportText(""); setTimeout(() => { setImportOpen(false); setImportResult(null); }, 1800); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Banken</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
            <span style={{ color: "var(--cream)" }}>◐</span> Grammatikkbanken
          </div>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
          <button onClick={copyGrammarWords}
            style={{ background: copied ? "var(--color-success)" : "none", border: `1px solid ${copied ? "var(--color-success)" : "rgba(230,211,168,0.3)"}`, borderRadius: 8, color: copied ? "white" : "var(--cream-deep)", fontFamily: "var(--font-body)", fontSize: 13, padding: "5px 14px", cursor: "pointer", transition: "all 0.3s" }}>
            {copied ? "✓ Kopiert" : "Kopier"}
          </button>
          <button onClick={() => setImportOpen(o => !o)}
            style={{ background: importOpen ? "rgba(230,211,168,0.18)" : "none", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 8, color: "var(--cream-deep)", fontFamily: "var(--font-body)", fontSize: 13, padding: "5px 14px", cursor: "pointer" }}>
            ↑ Importer
          </button>
        </div>
      </div>

      {importOpen && (
        <div style={{ background: "rgba(230,211,168,0.04)", borderBottom: "1px solid var(--border)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            value={importText}
            onChange={e => { setImportText(e.target.value); setImportResult(null); }}
            placeholder={"◐ je suis = jeg er (sjø swi) [pts:5] [topic:etre]\n◐ tu es = du er (tü e) [pts:3] [topic:etre]"}
            style={{ width: "100%", minHeight: 90, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 12, padding: 8, resize: "vertical", boxSizing: "border-box" }}
          />
          {importResult && (
            <div style={{ fontSize: 12, color: (importResult.added + importResult.updated) > 0 ? "var(--color-success)" : "var(--cream-deep)" }}>
              {(importResult.added + importResult.updated) > 0
                ? `✓ ${importResult.added} nye lagt til, ${importResult.updated} oppdatert`
                : "Ingen nye ord funnet"}
            </div>
          )}
          <button onClick={importGrammarWords} disabled={!importText.trim()}
            style={{ background: importText.trim() ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 8, color: importText.trim() ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontSize: 13, padding: "10px", cursor: importText.trim() ? "pointer" : "default" }}>
            Importer grammatikk
          </button>
        </div>
      )}

      <div style={{ padding: "24px 16px", flex: 1, overflowY: "auto" }}>
        {grammarByTopic.length === 0 && ungroupedGrammar.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "30vh" }}>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>◐</div>
            <p style={{ color: "var(--text-subtle)", textAlign: "center", lineHeight: 1.9 }}>Ingen grammatikkord lagret ennå.<br />Øv på Grammatikkøvelse for å fylle banken.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {grammarByTopic.map(({ topic, words: gw }) => {
              const sortedGw = [...gw].sort((a, b) => (a.points || 0) - (b.points || 0));
              const closed = closedSections.has(topic.id);
              return (
                <div key={topic.id}>
                  <button onClick={() => toggleSection(topic.id)}
                    style={{ width: "100%", background: "none", border: "none", borderBottom: "1px solid var(--border)", padding: "6px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text-subtle)", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: closed ? 0 : 8 }}>
                    <span>{topic.title} <span style={{ color: "var(--text-muted)" }}>({sortedGw.length})</span></span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{closed ? "▸" : "▾"}</span>
                  </button>
                  {!closed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sortedGw.map((w, i) => <GrammarWordCard key={w.id || i} w={w} />)}
                    </div>
                  )}
                </div>
              );
            })}
            {ungroupedGrammar.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...ungroupedGrammar].sort((a, b) => (a.points || 0) - (b.points || 0)).map((w, i) => (
                  <GrammarWordCard key={w.id || i} w={w} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {grammarWords.length > 0 && (
        <div style={{ padding: "0 16px 24px" }}>
          <button onClick={onClearGrammar}
            style={{ background: "none", border: "1px solid rgba(225,112,85,0.4)", borderRadius: 8, color: "var(--color-error)", fontFamily: "var(--font-body)", fontSize: 13, padding: "10px 20px", cursor: "pointer", width: "100%" }}>
            Nullstill grammatikkbanken
          </button>
        </div>
      )}

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
