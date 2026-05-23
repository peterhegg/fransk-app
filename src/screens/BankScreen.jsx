import { MASTERY_POINTS } from "../constants.js";
import { getWordTier } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

export default function BankScreen({ words, grammarWords, onGoOrdbanken, onGoGrammatikk, onBack, screen, showWords, onNav }) {
  const masteredWords = words.filter(w => getWordTier(w.points || 0) === 5).length;
  const masteredGram = grammarWords.filter(w => getWordTier(w.points || 0) === 5).length;

  const card = (icon, title, subtitle, count, mastered, onClick) => (
    <button onClick={onClick} style={{
      width: "100%", background: "var(--surface)", border: "1px solid rgba(230,211,168,0.2)",
      borderRadius: 18, padding: "22px 20px", display: "flex", alignItems: "center",
      gap: 18, cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left",
      boxShadow: "var(--shadow-md)", transition: "border-color 0.15s",
    }}>
      <div style={{ fontSize: 32, lineHeight: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", lineHeight: 1.5 }}>{subtitle}</div>
        <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--cream)" }}>{count} <span style={{ color: "var(--text-subtle)", fontWeight: 400 }}>lagret</span></span>
          {mastered > 0 && (
            <span style={{ fontSize: 13, color: "var(--cream-deep)" }}>★ {mastered} <span style={{ color: "var(--text-subtle)", fontWeight: 400 }}>mestret</span></span>
          )}
        </div>
      </div>
      <span style={{ color: "var(--cream-deep)", fontSize: 18 }}>▸</span>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
          <span style={{ color: "var(--cream)" }}>◈</span> Banken
        </div>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {card(
          "◈",
          "Ordbanken",
          "Vokabularet ditt — alle ord du har lært",
          words.length,
          masteredWords,
          onGoOrdbanken
        )}
        {card(
          "◐",
          "Grammatikkbanken",
          "Grammatikk du har øvd på",
          grammarWords.length,
          masteredGram,
          onGoGrammatikk
        )}
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
