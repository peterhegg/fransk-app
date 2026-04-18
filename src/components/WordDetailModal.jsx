import { useState, useRef, useEffect } from "react";
import { MASTERY_COLORS, MASTERY_LABELS, MASTERY_POINTS, VOCAB_CAT_ORDER, VOCAB_CAT_MAP } from "../constants.js";
import { getWordTier } from "../utils.jsx";

function speakFr(text) {
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "fr-FR";
  utt.rate = 0.9;
  window.speechSynthesis?.speak(utt);
}

export function getCatForWord(w) {
  return w.cat || VOCAB_CAT_MAP[w.fr] || "Andre ord";
}

export default function WordDetailModal({ word, onClose, onSave, extraCats = [] }) {
  const pts = word.points || 0;
  const tier = getWordTier(pts);
  const currentCat = getCatForWord(word);
  const [editingCat, setEditingCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState(currentCat);
  const [dragY, setDragY] = useState(0);
  const [animated, setAnimated] = useState(false);
  const dragStartY = useRef(null);
  const sheetRef = useRef(null);

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
      if (dy > 0) { setDragY(dy); e.preventDefault(); }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragY(0);
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

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: "24px 24px 0 0",
          padding: "24px 24px 40px",
          boxShadow: "0 -8px 40px rgba(108,92,231,0.15)",
          animation: animated ? "none" : "slideUp 0.25s ease both",
          transform: animated ? `translateY(${dragY}px)` : undefined,
          transition: animated && dragY === 0 ? "transform 0.3s ease" : "none",
          touchAction: "pan-y",
        }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />

        <div style={{ textAlign: "center", marginBottom: 20, position: "relative" }}>
          <div style={{ fontSize: 32, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)", marginBottom: 4 }}>{word.fr}</div>
          {word.phonetic && <div style={{ fontSize: 14, color: "var(--accent)", opacity: 0.7, marginBottom: 6 }}>({word.phonetic})</div>}
          <div style={{ fontSize: 18, color: "var(--text-subtle)" }}>{word.no}</div>
          <button
            onClick={() => speakFr(word.fr)}
            style={{ position: "absolute", top: 0, right: 0, background: "var(--accent-bg)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17 }}>
            🔊
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "var(--bg)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{pts}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>av {MASTERY_POINTS} pts</div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (pts / MASTERY_POINTS) * 100)}%`, background: "linear-gradient(to right, var(--accent), var(--accent-light))", borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ flex: 1, background: "var(--bg)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MASTERY_COLORS[tier] || "var(--accent)", marginBottom: 4 }}>
              {tier === 5 ? "★ mestret" : MASTERY_LABELS[tier]}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>Mestringsnivå</div>
          </div>
        </div>

        <div style={{ background: "var(--bg)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editingCat ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Kategori</div>
              <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{selectedCat}</div>
            </div>
            <button onClick={() => setEditingCat(e => !e)}
              style={{ background: "var(--accent-bg)", border: "none", borderRadius: 10, color: "var(--accent)", fontSize: 12, fontWeight: 500, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {editingCat ? "Avbryt" : "Endre"}
            </button>
          </div>
          {editingCat && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {allCats.map(cat => (
                  <button key={cat} onClick={() => setSelectedCat(cat)}
                    style={{ background: selectedCat === cat ? "var(--accent)" : "var(--surface)", border: `1px solid ${selectedCat === cat ? "var(--accent)" : "var(--border)"}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: selectedCat === cat ? "white" : "var(--text)", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <button onClick={save}
                style={{ width: "100%", background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 12, color: "white", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, padding: "12px", cursor: "pointer" }}>
                Lagre kategori
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
