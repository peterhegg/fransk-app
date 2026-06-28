import { useState, useRef, useEffect } from "react";
import { MASTERY_COLORS, MASTERY_LABELS, MASTERY_POINTS } from "../constants.js";
import { VOCAB_CAT_ORDER, VOCAB_CAT_MAP, GRAMMAR_TOPICS } from "../content.js";
import { getWordTier } from "../utils.jsx";

function speakFr(text) {
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "fr-FR";
  utt.rate = 0.9;
  window.speechSynthesis?.speak(utt);
}

const FORM_LABELS = {
  n: "Entall", np: "Flertall",
  v: "Infinitiv", pr: "Presens", pc: "Passé composé", imp: "Imperfekt",
  f: "Futur", c: "Kondisjonalis", impv: "Imperativ", pp: "Partisipp",
  "adj-f": "Fem. entall", "adj-mp": "Han. flertall", "adj-fp": "Fem. flertall",
};

function FormsSection({ forms }) {
  const groups = {};
  for (const [form, type] of forms) {
    if (!groups[type]) groups[type] = [];
    groups[type].push(form);
  }
  return (
    <div style={{ background: "var(--bg)", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Bøyingsformer</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
        {Object.entries(groups).map(([type, entries]) =>
          entries.map((form, i) => (
            <div key={`${type}-${i}`} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, color: "var(--text-subtle)", opacity: 0.7 }}>{FORM_LABELS[type] || type}</span>
              <span style={{ fontSize: 13, color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-display)" }}>{form}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Categories that should fall through to VOCAB_CAT_MAP:
// - "Andre ord" (default/unset)
// - Old category names renamed in the new system
const LEGACY_CATS = new Set([
  "Andre ord",
  "Hilsener",          // → "Hilsener og høflighet"
  "Tid",               // → "Tid og frekvens"
  "Verden og natur",   // → "Natur og vær" / "Familie og relasjoner" etc.
  "Politikk og samfunn", // → "Samfunn og politikk"
]);

export function getCatForWord(w) {
  if (w.cat && !LEGACY_CATS.has(w.cat)) return w.cat;
  return VOCAB_CAT_MAP[w.fr] || "Andre ord";
}

export default function WordDetailModal({ word, onClose, onSave, onDelete, extraCats = [] }) {
  const pts = word.points || 0;
  const tier = getWordTier(pts);
  const isGrammar = !!word.topicId;
  const grammarTopic = isGrammar ? GRAMMAR_TOPICS.find(t => t.id === word.topicId)?.title || word.topicId : null;
  const currentCat = isGrammar ? grammarTopic : getCatForWord(word);
  const [editingCat, setEditingCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState(currentCat);
  const [editingWord, setEditingWord] = useState(false);
  const [editFr, setEditFr] = useState(word.fr);
  const [editNo, setEditNo] = useState(word.no);
  const [editPhonetic, setEditPhonetic] = useState(word.phonetic || "");
  const [frAccepted, setFrAccepted] = useState(word.frAccepted || []);
  const [noAccepted, setNoAccepted] = useState(word.noAccepted || []);
  const [newFrAccepted, setNewFrAccepted] = useState("");
  const [newNoAccepted, setNewNoAccepted] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [animated, setAnimated] = useState(false);
  const dragStartY = useRef(null);
  const sheetRef = useRef(null);
  const insideScrolled = useRef(false);

  const allCats = [...VOCAB_CAT_ORDER, ...extraCats.filter(c => !VOCAB_CAT_ORDER.includes(c))];

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
    const timer = setTimeout(() => setAnimated(true), 260);
    return () => {
      document.body.style.overscrollBehavior = "";
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (dragStartY.current === null) return;
      const dy = e.touches[0].clientY - dragStartY.current;
      if (dy > 0 && !insideScrolled.current) { setDragY(dy); e.preventDefault(); }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragY(0);
    insideScrolled.current = (sheetRef.current?.scrollTop ?? 0) > 0;
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    else setDragY(0);
    dragStartY.current = null;
  };

  const save = () => {
    onSave({ ...word, cat: selectedCat });
    setEditingCat(false);
  };

  const saveWord = () => {
    onSave({ ...word, fr: editFr.trim(), no: editNo.trim(), phonetic: editPhonetic.trim(), cat: selectedCat, frAccepted, noAccepted });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          background: "var(--surface-solid)",
          borderRadius: "24px 24px 0 0",
          padding: "24px 24px 40px",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.4)",
          animation: animated ? "none" : "slideUp 0.25s ease both",
          transform: animated ? `translateY(${dragY}px)` : undefined,
          transition: animated && dragY === 0 ? "transform 0.3s ease" : "none",
          touchAction: "pan-y",
          maxHeight: "88dvh",
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
        }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />

        <div style={{ marginBottom: 20, position: "relative" }}>
          {editingWord ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>Fransk</div>
              <input value={editFr} onChange={e => setEditFr(e.target.value)}
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 18, padding: "10px 14px", outline: "none", fontStyle: "italic" }} />
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>Norsk</div>
              <input value={editNo} onChange={e => setEditNo(e.target.value)}
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 15, padding: "10px 14px", outline: "none" }} />
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>Fonetikk (valgfritt)</div>
              <input value={editPhonetic} onChange={e => setEditPhonetic(e.target.value)} placeholder="f.eks. luh moo"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, padding: "10px 14px", outline: "none" }} />

              <div style={{ marginTop: 8, background: "var(--bg)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--cream-deep)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Aksepterte fr-stavemåter</div>
                {frAccepted.map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text)", fontStyle: "italic" }}>{v}</span>
                    <button onClick={() => setFrAccepted(a => a.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", color: "var(--color-error)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input value={newFrAccepted} onChange={e => setNewFrAccepted(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newFrAccepted.trim()) { setFrAccepted(a => [...a, newFrAccepted.trim()]); setNewFrAccepted(""); } }}
                    placeholder="Legg til fr-stavemåte…"
                    style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13, padding: "7px 10px", outline: "none" }} />
                  <button onClick={() => { if (newFrAccepted.trim()) { setFrAccepted(a => [...a, newFrAccepted.trim()]); setNewFrAccepted(""); } }}
                    style={{ background: "rgba(230,211,168,0.1)", border: "none", borderRadius: 8, color: "var(--cream)", fontSize: 13, fontWeight: 600, padding: "7px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>+</button>
                </div>
              </div>

              <div style={{ background: "var(--bg)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--cream-deep)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Aksepterte no-stavemåter</div>
                {noAccepted.map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{v}</span>
                    <button onClick={() => setNoAccepted(a => a.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", color: "var(--color-error)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input value={newNoAccepted} onChange={e => setNewNoAccepted(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newNoAccepted.trim()) { setNoAccepted(a => [...a, newNoAccepted.trim()]); setNewNoAccepted(""); } }}
                    placeholder="Legg til no-stavemåte…"
                    style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13, padding: "7px 10px", outline: "none" }} />
                  <button onClick={() => { if (newNoAccepted.trim()) { setNoAccepted(a => [...a, newNoAccepted.trim()]); setNewNoAccepted(""); } }}
                    style={{ background: "rgba(230,211,168,0.1)", border: "none", borderRadius: 8, color: "var(--cream)", fontSize: 13, fontWeight: 600, padding: "7px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>+</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setEditingWord(false)}
                  style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)", fontSize: 14, padding: "11px", cursor: "pointer" }}>
                  Avbryt
                </button>
                <button onClick={saveWord}
                  style={{ flex: 2, background: "var(--cream)", border: "none", borderRadius: 12, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, padding: "11px", cursor: "pointer" }}>
                  Lagre
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", position: "relative" }}>
              <div style={{ fontSize: 32, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)", marginBottom: 4 }}>{word.fr}</div>
              {(word.phonetic || word.p) && <div style={{ fontSize: 14, color: "var(--cream-deep)", opacity: 0.8, marginBottom: 6 }}>({word.phonetic || word.p})</div>}
              <div style={{ fontSize: 18, color: "var(--text-subtle)" }}>{word.no}</div>
              {(word.frAccepted?.length > 0 || word.noAccepted?.length > 0) && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-subtle)" }}>
                  {word.frAccepted?.length > 0 && <span>fr: {word.frAccepted.join(", ")} </span>}
                  {word.noAccepted?.length > 0 && <span>no: {word.noAccepted.join(", ")}</span>}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
                <button onClick={() => speakFr(word.fr)}
                  style={{ background: "rgba(230,211,168,0.1)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17 }}>
                  🔊
                </button>
                <button onClick={() => setEditingWord(true)}
                  style={{ background: "rgba(230,211,168,0.1)", border: "none", borderRadius: 10, height: 36, padding: "0 14px", color: "var(--cream)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  Rediger
                </button>
              </div>
            </div>
          )}
        </div>

        {word.forms?.length > 0 && <FormsSection forms={word.forms} />}

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "var(--bg)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--cream)" }}>{pts}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>av {MASTERY_POINTS} pts</div>
            <div style={{ height: 4, background: "rgba(230,211,168,0.1)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (pts / MASTERY_POINTS) * 100)}%`, background: "var(--cream)", borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ flex: 1, background: "var(--bg)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MASTERY_COLORS[tier] || "var(--cream)", marginBottom: 4 }}>
              {tier === 5 ? "★ mestret" : MASTERY_LABELS[tier]}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>Mestringsnivå</div>
          </div>
        </div>

        <div style={{ background: "var(--bg)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editingCat ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{isGrammar ? "Emne" : "Kategori"}</div>
              <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{selectedCat}</div>
            </div>
            {!isGrammar && (
              <button onClick={() => setEditingCat(e => !e)}
                style={{ background: "rgba(230,211,168,0.1)", border: "none", borderRadius: 10, color: "var(--cream)", fontSize: 12, fontWeight: 500, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                {editingCat ? "Avbryt" : "Endre"}
              </button>
            )}
          </div>
          {!isGrammar && editingCat && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {allCats.map(cat => (
                  <button key={cat} onClick={() => setSelectedCat(cat)}
                    style={{ background: selectedCat === cat ? "rgba(230,211,168,0.18)" : "var(--surface)", border: `1px solid ${selectedCat === cat ? "rgba(230,211,168,0.5)" : "var(--border)"}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: selectedCat === cat ? "var(--cream)" : "var(--text)", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <button onClick={save}
                style={{ width: "100%", background: "var(--cream)", border: "none", borderRadius: 12, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, padding: "12px", cursor: "pointer" }}>
                Lagre kategori
              </button>
            </>
          )}
        </div>

        {onDelete && (
          <div style={{ marginTop: 16 }}>
            {confirmDelete ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, padding: "12px", cursor: "pointer" }}>
                  Avbryt
                </button>
                <button onClick={() => { onDelete(word); onClose(); }}
                  style={{ flex: 1, background: "rgba(200,80,80,0.15)", border: "1px solid rgba(200,80,80,0.4)", borderRadius: 12, color: "var(--color-error)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, padding: "12px", cursor: "pointer" }}>
                  Slett ord
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                style={{ width: "100%", background: "none", border: "1px solid rgba(200,80,80,0.3)", borderRadius: 12, color: "var(--color-error)", fontFamily: "var(--font-body)", fontSize: 14, padding: "11px", cursor: "pointer", opacity: 0.7 }}>
                Fjern fra ordbanken
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
