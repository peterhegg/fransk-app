import { useState } from "react";
import { gold, dark, cream, card, brd, grn, red, MASTERY_LABELS, MASTERY_COLORS, SR_INTERVALS, WORDS_KEY, MASTERY_POINTS, DAGENS_GLOSE_KEY } from "../constants.js";
import BottomNav from "../components/BottomNav.jsx";

export default function WordsScreen({ words, setWords, onBack, screen, showWords, onNav, onClearGrammar }) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addFr, setAddFr] = useState("");
  const [addNo, setAddNo] = useState("");
  const [addPhonetic, setAddPhonetic] = useState("");
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const addWord = () => {
    if (!addFr.trim()) return;
    const nw = { id: Date.now() + Math.random(), fr: addFr.trim(), no: addNo.trim(), phonetic: addPhonetic.trim(), level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now() };
    setWords(prev => prev.some(w => w.fr === nw.fr) ? prev : [...prev, nw]);
    setAddFr(""); setAddNo(""); setAddPhonetic(""); setAddOpen(false);
  };

  const importWords = () => {
    const lines = importText.split("\n").map(l => l.trim()).filter(Boolean);
    let added = 0, updated_count = 0;
    setWords(prev => {
      let updated = [...prev];
      for (const line of lines) {
        const clean = line.replace(/^[✓✗•\-*]\s*/, "").trim();
        const eqIdx = clean.indexOf(" = ");
        if (eqIdx === -1) continue;
        const fr = clean.slice(0, eqIdx).trim();
        if (!fr) continue;
        let rest = clean.slice(eqIdx + 3).trim();
        // Parse optional points: [pts:42]
        const ptsMatch = rest.match(/\[pts:(\d+)\]\s*$/);
        const importedPoints = ptsMatch ? parseInt(ptsMatch[1], 10) : null;
        if (ptsMatch) rest = rest.slice(0, ptsMatch.index).trim();
        const pm = rest.match(/\(([^)]+)\)\s*$/);
        const phonetic = pm ? pm[1].trim() : "";
        const no = pm ? rest.slice(0, pm.index).trim() : rest;
        const existing = updated.find(w => w.fr === fr);
        if (existing) {
          if (importedPoints !== null) {
            updated = updated.map(w => w.fr === fr ? { ...w, points: importedPoints } : w);
            updated_count++;
          }
          continue;
        }
        const pts = importedPoints ?? 0;
        updated.push({ id: Date.now() + Math.random(), fr, no, phonetic, level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now(), points: pts });
        added++;
      }
      return updated;
    });
    const total = added + updated_count;
    setImportResult({ added, updated: updated_count });
    if (total > 0) { setImportText(""); setTimeout(() => { setImportOpen(false); setImportResult(null); }, 1800); }
  };

  const copyWords = () => {
    if (!words.length) return;
    navigator.clipboard.writeText(
      "Mine franske ord:\n" +
      words.map(w => {
        const pts = w.points || 0;
        return `✓ ${w.fr}${w.no ? ` = ${w.no}` : ""}${w.phonetic ? ` (${w.phonetic})` : ""} [pts:${pts}]`;
      }).join("\n")
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const clearWords = () => {
    setWords([]);
    onClearGrammar?.();
    localStorage.removeItem(WORDS_KEY);
    localStorage.removeItem("fransk-laering-ord");
    localStorage.removeItem(DAGENS_GLOSE_KEY);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: card, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>◈</span> Ordsamlingen din</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setImportOpen(o => !o); setAddOpen(false); }}
            style={{ background: importOpen ? gold : "none", border: `1px solid ${gold}66`, borderRadius: 8, color: importOpen ? dark : gold, fontSize: 13, padding: "4px 12px", cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>↑ Importer</button>
          <button onClick={() => { setAddOpen(o => !o); setImportOpen(false); }}
            style={{ background: addOpen ? gold : "none", border: `1px solid ${gold}66`, borderRadius: 8, color: addOpen ? dark : gold, fontSize: 13, padding: "4px 12px", cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>+ Legg til</button>
        </div>
      </div>

      {importOpen && (
        <div style={{ background: "#F0E8D5", borderBottom: `1px solid ${brd}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: `rgba(29,22,16,0.55)`, lineHeight: 1.5 }}>Format: <em>✓ bonjour = hallo (bånsjur) [pts:42]</em> — [pts:…] er valgfritt</div>
          <textarea placeholder={"✓ bonjour = hallo (bånsjur) [pts:42]\n✓ merci = takk (merssi)"} value={importText} onChange={e => { setImportText(e.target.value); setImportResult(null); }} rows={5}
            style={{ background: "#f5f0e6", border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "10px 12px", outline: "none", resize: "vertical" }} />
          {importResult !== null && (
            <div style={{ fontSize: 13, fontWeight: "bold", color: (importResult.added + importResult.updated) > 0 ? grn : gold }}>
              {importResult.added === 0 && importResult.updated === 0
                ? "Ingen nye ord funnet."
                : [
                    importResult.added > 0 && `✓ ${importResult.added} nye ord lagt til`,
                    importResult.updated > 0 && `${importResult.updated} oppdatert`,
                  ].filter(Boolean).join(", ") + "."}
            </div>
          )}
          <button onClick={importWords} disabled={!importText.trim()} className={importText.trim() ? "btn-shine" : ""}
            style={{ background: importText.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : "rgba(200,120,58,0.25)", border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 14, padding: "10px", cursor: importText.trim() ? "pointer" : "default" }}>
            Importer ord
          </button>
        </div>
      )}

      {addOpen && (
        <div style={{ background: "#F0E8D5", borderBottom: `1px solid ${brd}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Fransk ord *" value={addFr} onChange={e => setAddFr(e.target.value)} style={{ background: "#f5f0e6", border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <input placeholder="Norsk oversettelse" value={addNo} onChange={e => setAddNo(e.target.value)} style={{ background: "#f5f0e6", border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <input placeholder="Uttale (f.eks. bånsjur)" value={addPhonetic} onChange={e => setAddPhonetic(e.target.value)} onKeyDown={e => e.key === "Enter" && addWord()}
            style={{ background: "#f5f0e6", border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <button onClick={addWord} disabled={!addFr.trim()} className={addFr.trim() ? "btn-shine" : ""}
            style={{ background: addFr.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : "rgba(200,120,58,0.25)", border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 14, padding: "10px", cursor: addFr.trim() ? "pointer" : "default" }}>
            Lagre ord
          </button>
        </div>
      )}

      <div style={{ padding: "24px 16px", flex: 1, overflowY: "auto" }}>
        {words.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh" }}>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>◎</div>
            <p style={{ color: "rgba(29,22,16,0.4)", textAlign: "center", lineHeight: 1.9 }}>Ingen ord lagret ennå.<br />Øv på Gloseøvelse, så lagres ordene automatisk her.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, fontSize: 11, color: `${gold}88`, letterSpacing: 1, textTransform: "uppercase", flexWrap: "wrap" }}>
              {MASTERY_LABELS.map((label, i) => {
                const isMasteredTier = i === MASTERY_LABELS.length - 1;
                const count = isMasteredTier
                  ? words.filter(w => (w.points || 0) >= MASTERY_POINTS).length
                  : words.filter(w => (w.level ?? 0) === i && (w.points || 0) < MASTERY_POINTS).length;
                return <span key={i}><span style={{ color: MASTERY_COLORS[i] }}>●</span> {label} ({count})</span>;
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {words.map((w, i) => {
                const lvl = Math.min(w.level ?? 0, MASTERY_LABELS.length - 1);
                const pts = w.points || 0;
                const isMastered = pts >= MASTERY_POINTS;
                return (
                  <div key={i} style={{ background: card, border: `1px solid ${isMastered ? gold + "44" : brd}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: grn, marginRight: 6 }}>✓</span>
                      <span style={{ fontSize: 14 }}>{w.fr}</span>
                      {w.no && <span style={{ color: `${cream}66`, fontSize: 13 }}> = {w.no}</span>}
                      {w.phonetic && <span style={{ color: `${gold}88`, fontSize: 12 }}> ({w.phonetic})</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: 10, color: isMastered ? gold : MASTERY_COLORS[lvl], letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: isMastered ? "bold" : "normal" }}>
                        {isMastered ? "★ mestret" : MASTERY_LABELS[lvl]}
                      </div>
                      <div style={{ fontSize: 10, color: `rgba(29,22,16,0.35)`, letterSpacing: 0.5 }}>{pts} / {MASTERY_POINTS} pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {words.length > 0 && (
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={copyWords}
            style={{ background: copied ? grn : "none", border: `1px solid ${copied ? grn : gold}88`, borderRadius: 8, color: copied ? dark : gold, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", width: "100%", transition: "all 0.3s", fontWeight: copied ? "bold" : "normal" }}>
            {copied ? "✓ Kopiert!" : "Kopier ordlisten min"}
          </button>
          <button onClick={clearWords}
            style={{ background: "none", border: `1px solid ${red}55`, borderRadius: 8, color: red, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "10px 20px", cursor: "pointer", width: "100%" }}>
            Nullstill alt (ord + grammatikk)
          </button>
        </div>
      )}
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
