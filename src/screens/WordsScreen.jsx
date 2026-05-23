import { useState } from "react";
import { MASTERY_LABELS, MASTERY_COLORS, SR_INTERVALS, WORDS_KEY, MASTERY_POINTS, DAGENS_GLOSE_KEY, VOCAB_CAT_ORDER, VOCAB_LIST } from "../constants.js";
import { getWordTier } from "../utils.jsx";
import { STATIC_VOCAB } from "../static_vocab.js";
import BottomNav from "../components/BottomNav.jsx";
import WordDetailModal, { getCatForWord } from "../components/WordDetailModal.jsx";

const CUSTOM_CATS_KEY = "fransk-custom-cats";

function loadCustomCats() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY) || "[]"); } catch { return []; }
}

function saveCustomCats(cats) {
  try { localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(cats)); } catch {}
}

function WordCard({ w, onClick }) {
  const pts = w.points || 0;
  const tier = getWordTier(pts);
  const isMastered = tier === 5;
  return (
    <div onClick={onClick} style={{ background: "var(--surface)", border: `1px solid ${isMastered ? "rgba(230,211,168,0.4)" : "var(--border)"}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: "var(--color-success)", marginRight: 6 }}>✓</span>
        <span style={{ fontSize: 14, color: "var(--text)" }}>{w.fr}</span>
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

function CatManageModal({ onClose, customCats, onSave, words, setWords }) {
  const [cats, setCats] = useState(customCats);
  const [newCatName, setNewCatName] = useState("");
  const [renamingCat, setRenamingCat] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const builtInCats = VOCAB_CAT_ORDER;
  const allCats = [...builtInCats, ...cats.filter(c => !builtInCats.includes(c))];

  const addCat = () => {
    const name = newCatName.trim();
    if (!name || allCats.includes(name)) return;
    const next = [...cats, name];
    setCats(next);
    setNewCatName("");
  };

  const startRename = (cat) => { setRenamingCat(cat); setRenameValue(cat); };

  const confirmRename = (oldName) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) { setRenamingCat(null); return; }
    setWords(prev => prev.map(w => getCatForWord(w) === oldName ? { ...w, cat: newName } : w));
    setCats(prev => prev.map(c => c === oldName ? newName : c).filter(c => !builtInCats.includes(c) || c === newName));
    setRenamingCat(null);
  };

  const deleteCat = (cat) => {
    setWords(prev => prev.map(w => getCatForWord(w) === cat ? { ...w, cat: "Andre ord" } : w));
    setCats(prev => prev.filter(c => c !== cat));
  };

  const save = () => {
    onSave(cats.filter(c => !VOCAB_CAT_ORDER.includes(c)));
  };

  const inputStyle = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, padding: "8px 12px", outline: "none", flex: 1 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "var(--surface-solid)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", boxShadow: "0 -4px 32px rgba(0,0,0,0.4)", maxHeight: "80dvh", display: "flex", flexDirection: "column", overflowX: "hidden", width: "100%" }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Administrer kategorier</div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {allCats.map(cat => {
            const isBuiltIn = builtInCats.includes(cat);
            const count = words.filter(w => getCatForWord(w) === cat).length;
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {renamingCat === cat ? (
                  <>
                    <input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmRename(cat)} autoFocus style={inputStyle} />
                    <button onClick={() => confirmRename(cat)} style={{ background: "var(--cream)", border: "none", borderRadius: 8, color: "var(--bg)", fontSize: 12, padding: "8px 12px", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>OK</button>
                    <button onClick={() => setRenamingCat(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-subtle)", fontSize: 12, padding: "8px 10px", cursor: "pointer", fontFamily: "var(--font-body)" }}>✕</button>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</div>
                      <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{count} ord{isBuiltIn ? " · innebygd" : ""}</div>
                    </div>
                    <button onClick={() => startRename(cat)} style={{ background: "rgba(230,211,168,0.1)", border: "none", borderRadius: 8, color: "var(--cream)", fontSize: 12, padding: "6px 10px", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", flexShrink: 0 }}>Endre</button>
                    {cat !== "Andre ord" && (
                      <button onClick={() => deleteCat(cat)} style={{ background: "none", border: "1px solid rgba(225,112,85,0.4)", borderRadius: 8, color: "var(--color-error)", fontSize: 12, padding: "6px 10px", cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>✕</button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 8 }}>Legg til ny kategori</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCat()} placeholder="Kategorinavn…" style={inputStyle} />
              <button onClick={addCat} disabled={!newCatName.trim()} style={{ background: newCatName.trim() ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 8, color: newCatName.trim() ? "var(--bg)" : "var(--text-subtle)", fontSize: 13, padding: "8px 14px", cursor: newCatName.trim() ? "pointer" : "default", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>+ Legg til</button>
            </div>
          </div>
        </div>

        <button onClick={save} style={{ marginTop: 16, width: "100%", background: "var(--cream)", border: "none", borderRadius: 12, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, padding: "12px", cursor: "pointer" }}>
          Lagre
        </button>
      </div>
    </div>
  );
}

export default function WordsScreen({ words, setWords, onBack, onClearWords, screen, showWords, onNav }) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addFr, setAddFr] = useState("");
  const [addNo, setAddNo] = useState("");
  const [addPhonetic, setAddPhonetic] = useState("");
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [filterTier, setFilterTier] = useState(null);
  const [openSections, setOpenSections] = useState(new Set());
  const [selectedWord, setSelectedWord] = useState(null);
  const [customCats, setCustomCats] = useState(loadCustomCats);
  const [catManageOpen, setCatManageOpen] = useState(false);

  const allCats = [...VOCAB_CAT_ORDER, ...customCats.filter(c => !VOCAB_CAT_ORDER.includes(c))];

  const toggleSection = (cat) => setOpenSections(prev => {
    const next = new Set(prev);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    return next;
  });

  const addWord = () => {
    if (!addFr.trim()) return;
    const nw = { id: Date.now() + Math.random(), fr: addFr.trim(), no: addNo.trim(), phonetic: addPhonetic.trim(), level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now() };
    setWords(prev => prev.some(w => w.fr === nw.fr) ? prev : [...prev, nw]);
    setAddFr(""); setAddNo(""); setAddPhonetic(""); setAddOpen(false);
  };

  const importWords = () => {
    const text = importText.trim();
    let added = 0, updated_count = 0;

    if (text.startsWith("[")) {
      let parsed;
      try { parsed = JSON.parse(text); } catch { setImportResult({ error: "Ugyldig JSON" }); return; }
      if (!Array.isArray(parsed)) { setImportResult({ error: "Forventet JSON-array" }); return; }
      setWords(prev => {
        let updated = [...prev];
        for (const w of parsed) {
          if (!w.fr) continue;
          const existing = updated.find(e => e.fr === w.fr);
          if (existing) {
            updated = updated.map(e => e.fr !== w.fr ? e : {
              ...e,
              no: w.no ?? e.no, phonetic: w.phonetic ?? e.phonetic,
              forms: w.forms?.length ? w.forms : e.forms,
              level: w.level ?? e.level, nextReview: w.nextReview ?? e.nextReview,
              points: w.points ?? e.points, goal: w.goal ?? e.goal,
              ...(w.cat ? { cat: w.cat } : {}),
            });
            updated_count++;
          } else {
            updated.push({
              id: Date.now() + Math.random(),
              fr: w.fr, no: w.no || "", phonetic: w.phonetic || "",
              forms: w.forms || [], level: w.level ?? 0,
              nextReview: w.nextReview ?? Date.now() + SR_INTERVALS[0] * 86400000,
              added: w.added ?? Date.now(), points: w.points || 0,
              goal: w.goal || "core", ...(w.cat ? { cat: w.cat } : {}),
            });
            added++;
          }
        }
        return updated;
      });
    } else {
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      setWords(prev => {
        let updated = [...prev];
        for (const line of lines) {
          const clean = line.replace(/^[✓✗•\-*]\s*/, "").trim();
          const eqIdx = clean.indexOf(" = ");
          if (eqIdx === -1) continue;
          const fr = clean.slice(0, eqIdx).trim();
          if (!fr) continue;
          let rest = clean.slice(eqIdx + 3).trim();
          const catMatch = rest.match(/\[cat:([^\]]+)\]\s*$/);
          const importedCat = catMatch ? catMatch[1].trim() : null;
          if (catMatch) rest = rest.slice(0, catMatch.index).trim();
          const goalMatch = rest.match(/\[goal:([^\]]+)\]\s*$/);
          const importedGoal = goalMatch ? goalMatch[1].trim() : "core";
          if (goalMatch) rest = rest.slice(0, goalMatch.index).trim();
          const ptsMatch = rest.match(/\[pts:([\d.]+)\]\s*$/);
          const importedPoints = ptsMatch ? parseFloat(ptsMatch[1]) : null;
          if (ptsMatch) rest = rest.slice(0, ptsMatch.index).trim();
          const pm = rest.match(/\(([^)]+)\)\s*$/);
          const phonetic = pm ? pm[1].trim() : "";
          const no = pm ? rest.slice(0, pm.index).trim() : rest;
          const existing = updated.find(w => w.fr === fr);
          if (existing) {
            if (importedPoints !== null || importedCat !== null) {
              updated = updated.map(w => {
                if (w.fr !== fr) return w;
                return { ...w, ...(importedPoints !== null ? { points: importedPoints } : {}), ...(importedCat ? { cat: importedCat } : {}) };
              });
              updated_count++;
            }
            continue;
          }
          updated.push({ id: Date.now() + Math.random(), fr, no, phonetic, forms: [], level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now(), points: importedPoints ?? 0, goal: importedGoal, ...(importedCat ? { cat: importedCat } : {}) });
          added++;
        }
        return updated;
      });
    }

    setImportResult({ added, updated: updated_count });
    if (added + updated_count > 0) { setImportText(""); setTimeout(() => { setImportOpen(false); setImportResult(null); }, 1800); }
  };

  const copyWords = () => {
    if (!words.length) return;
    const lines = words.map(w => {
      const pts = w.points || 0;
      const ph = w.phonetic || w.p || "";
      const goal = w.goal || "core";
      const cat = getCatForWord(w);
      return `✓ ${w.fr} = ${w.no}${ph ? ` (${ph})` : ""} [pts:${pts}] [goal:${goal}] [cat:${cat}]`;
    });
    navigator.clipboard.writeText(lines.join("\n"))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const downloadStaticVocab = () => {
    const normFr = fr => (fr || "").replace(/^(le |la |les |l')/i, "").trim().toLowerCase();
    const learnedFr = new Set();
    for (const w of words) {
      const base = normFr(w.fr);
      learnedFr.add(base);
      if (base.includes("/")) base.split("/").forEach(p => { const t = p.trim(); if (t) learnedFr.add(t); });
    }
    const lines = ["STATISK VOKABULAR I APPEN", "=".repeat(50), ""];
    for (const [section, entries] of [["vocab_list", VOCAB_LIST], ...Object.entries(STATIC_VOCAB)]) {
      lines.push(`\n[${section.toUpperCase()}] — ${entries.length} ord`);
      lines.push("-".repeat(40));
      for (const v of entries) {
        const fr = normFr(v.fr);
        const known = learnedFr.has(fr) ? " ✓" : "";
        const ph = v.phonetic || v.p || "";
        lines.push(`${v.fr} = ${v.no}${ph ? `  (${ph})` : ""}${known}`);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "app-vokabular.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadWords = () => {
    if (!words.length) return;
    const lines = words
      .slice()
      .sort((a, b) => (a.fr || "").localeCompare(b.fr || ""))
      .map(w => {
        const ph = w.phonetic || w.p || "";
        return `${w.fr} = ${w.no}${ph ? `  (${ph})` : ""}`;
      });
    const text = `Ordbank — ${words.length} ord\n${"=".repeat(40)}\n\n` + lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ordbank.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const clearWords = () => {
    onClearWords?.();
  };

  const panelBg = "rgba(230,211,168,0.04)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Banken</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
            <span style={{ color: "var(--cream)" }}>◈</span> Ordbanken
          </div>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
          <button onClick={() => setCatManageOpen(true)}
            style={{ background: "none", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 8, color: "var(--cream-deep)", fontSize: 13, padding: "5px 14px", cursor: "pointer", fontFamily: "var(--font-body)" }}>Kategorier</button>
          <button onClick={() => { setImportOpen(o => !o); setAddOpen(false); }}
            style={{ background: importOpen ? "rgba(230,211,168,0.18)" : "none", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 8, color: "var(--cream-deep)", fontSize: 13, padding: "5px 14px", cursor: "pointer", fontFamily: "var(--font-body)" }}>↑ Importer/eksporter</button>
          <button onClick={() => { setAddOpen(o => !o); setImportOpen(false); }}
            style={{ background: addOpen ? "rgba(230,211,168,0.18)" : "none", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 8, color: "var(--cream-deep)", fontSize: 13, padding: "5px 14px", cursor: "pointer", fontFamily: "var(--font-body)" }}>+ Legg til</button>
        </div>
      </div>

      {importOpen && (
        <div style={{ background: panelBg, borderBottom: "1px solid var(--border)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", lineHeight: 1.5 }}>Format: <em>✓ bonjour = hallo (bånsjur) [pts:42] [cat:Hilsener]</em> — tagene er valgfrie</div>
          <textarea placeholder={"✓ bonjour = hallo (bånsjur) [pts:42] [cat:Hilsener]\n✓ merci = takk (merssi)"} value={importText} onChange={e => { setImportText(e.target.value); setImportResult(null); }} rows={5}
            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13, padding: "10px 12px", outline: "none", resize: "vertical" }} />
          {importResult !== null && (
            <div style={{ fontSize: 13, fontWeight: "bold", color: (importResult.added + importResult.updated) > 0 ? "var(--color-success)" : "var(--cream-deep)" }}>
              {importResult.added === 0 && importResult.updated === 0
                ? "Ingen nye ord funnet."
                : [
                    importResult.added > 0 && `✓ ${importResult.added} nye ord lagt til`,
                    importResult.updated > 0 && `${importResult.updated} oppdatert`,
                  ].filter(Boolean).join(", ") + "."}
            </div>
          )}
          <button onClick={importWords} disabled={!importText.trim()} className={importText.trim() ? "btn-shine" : ""}
            style={{ background: importText.trim() ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 14, color: importText.trim() ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 14, padding: "10px", cursor: importText.trim() ? "pointer" : "default" }}>
            Importer ord
          </button>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={downloadStaticVocab}
              style={{ background: "none", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 8, color: "var(--cream-deep)", fontFamily: "var(--font-body)", fontSize: 13, padding: "8px 14px", cursor: "pointer", textAlign: "left" }}>
              ↓ Last ned app-vokabular
            </button>
            <button onClick={downloadWords}
              style={{ background: "none", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 8, color: "var(--cream-deep)", fontFamily: "var(--font-body)", fontSize: 13, padding: "8px 14px", cursor: "pointer", textAlign: "left" }}>
              ↓ Last ned min ordbank
            </button>
          </div>
        </div>
      )}

      {addOpen && (
        <div style={{ background: panelBg, borderBottom: "1px solid var(--border)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Fransk ord *" value={addFr} onChange={e => setAddFr(e.target.value)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <input placeholder="Norsk oversettelse" value={addNo} onChange={e => setAddNo(e.target.value)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <input placeholder="Uttale (f.eks. bånsjur)" value={addPhonetic} onChange={e => setAddPhonetic(e.target.value)} onKeyDown={e => e.key === "Enter" && addWord()}
            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <button onClick={addWord} disabled={!addFr.trim()} className={addFr.trim() ? "btn-shine" : ""}
            style={{ background: addFr.trim() ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 14, color: addFr.trim() ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 14, padding: "10px", cursor: addFr.trim() ? "pointer" : "default" }}>
            Lagre ord
          </button>
        </div>
      )}

      <div style={{ padding: "24px 16px", flex: 1, overflowY: "auto" }}>
        {words.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "30vh" }}>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>◎</div>
            <p style={{ color: "var(--text-subtle)", textAlign: "center", lineHeight: 1.9 }}>Ingen ord lagret ennå.<br />Øv på Gloseøvelse, så lagres ordene automatisk her.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {MASTERY_LABELS.map((label, i) => {
                const count = words.filter(w => getWordTier(w.points || 0) === i).length;
                const active = filterTier === i;
                return (
                  <button key={i} onClick={() => setFilterTier(active ? null : i)}
                    style={{ background: active ? MASTERY_COLORS[i] + "22" : "none", border: `1px solid ${active ? MASTERY_COLORS[i] : "transparent"}`, borderRadius: 20, padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: active ? MASTERY_COLORS[i] : "var(--text-subtle)" }}>
                    <span style={{ color: MASTERY_COLORS[i] }}>●</span> {label} ({count})
                  </button>
                );
              })}
              {filterTier !== null && (
                <button onClick={() => setFilterTier(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-subtle)" }}>✕ Vis alle</button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {allCats.map(cat => {
                const catWords = words
                  .filter(w => getCatForWord(w) === cat && (filterTier === null || getWordTier(w.points || 0) === filterTier))
                  .sort((a, b) => (a.points || 0) - (b.points || 0));
                if (!catWords.length) return null;
                const open = openSections.has(cat);
                return (
                  <div key={cat}>
                    <button onClick={() => toggleSection(cat)}
                      style={{ width: "100%", background: "none", border: "none", borderBottom: "1px solid var(--border)", padding: "6px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text-subtle)", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: open ? 8 : 0 }}>
                      <span>{cat} <span style={{ color: "var(--text-muted)" }}>({catWords.length})</span></span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{open ? "▾" : "▸"}</span>
                    </button>
                    {open && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {catWords.map((w, i) => (
                          <WordCard key={w.id || i} w={w} onClick={() => setSelectedWord(w)} />
                        ))}
                      </div>
                    )}
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
            style={{ background: copied ? "var(--color-success)" : "none", border: `1px solid ${copied ? "var(--color-success)" : "rgba(230,211,168,0.3)"}`, borderRadius: 8, color: copied ? "white" : "var(--cream-deep)", fontFamily: "var(--font-body)", fontSize: 13, padding: "10px 20px", cursor: "pointer", width: "100%", transition: "all 0.3s", fontWeight: copied ? "bold" : "normal" }}>
            {copied ? "✓ Kopiert!" : "Kopier ordlisten min"}
          </button>
          <button onClick={clearWords}
            style={{ background: "none", border: "1px solid rgba(225,112,85,0.4)", borderRadius: 8, color: "var(--color-error)", fontFamily: "var(--font-body)", fontSize: 13, padding: "10px 20px", cursor: "pointer", width: "100%" }}>
            Nullstill ordbanken
          </button>
        </div>
      )}

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />

      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          extraCats={customCats}
          onClose={() => setSelectedWord(null)}
          onSave={updated => {
            setWords(prev => prev.map(w => w.id === updated.id ? updated : w));
            setSelectedWord(null);
          }}
          onDelete={toDelete => {
            setWords(prev => prev.filter(w => w.id !== toDelete.id));
          }}
        />
      )}

      {catManageOpen && (
        <CatManageModal
          customCats={customCats}
          words={words}
          setWords={setWords}
          onClose={() => setCatManageOpen(false)}
          onSave={(newCats) => {
            setCustomCats(newCats);
            saveCustomCats(newCats);
            setCatManageOpen(false);
          }}
        />
      )}
    </div>
  );
}
