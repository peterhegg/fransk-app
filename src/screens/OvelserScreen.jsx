import BottomNav from "../components/BottomNav.jsx";
import GroupButton from "../components/GroupPicker.jsx";
import { IcoArrow } from "../components/Icons.jsx";
import { HUB_SECTIONS } from "../exercises.jsx";
import { VOCAB_GOALS, GRAMMAR_TOPICS } from "../content.js";

// Øv hub — the full exercise library, grouped by skill.
// Top-level nav destination (no back button — switch tabs via BottomNav).
// The "Gruppe" selectors set which vocab goal / grammar topic the exercises
// draw from (moved here from the Home screen).
export default function OvelserScreen({ onStart, words = [], grammarWords = [], gloseGroup, onGloseGroupChange, gramGroup, onGramGroupChange, ...navProps }) {
  const gloseGroups = VOCAB_GOALS.filter(g => words.some(w => (w.goal || "core") === g.id));
  const gloseCounts = { total: words.length, ...Object.fromEntries(gloseGroups.map(g => [g.id, words.filter(w => (w.goal || "core") === g.id).length])) };

  const gramGroups = GRAMMAR_TOPICS.filter(t => grammarWords.some(w => w.topicId === t.id));
  const gramCounts = { total: grammarWords.length, ...Object.fromEntries(gramGroups.map(t => [t.id, grammarWords.filter(w => w.topicId === t.id).length])) };

  const selectorFor = groupKey => {
    if (groupKey === "vocab") return <GroupButton groups={gloseGroups} selected={gloseGroup} onChange={onGloseGroupChange} wordCounts={gloseCounts} />;
    if (groupKey === "grammar") return <GroupButton groups={gramGroups} selected={gramGroup} onChange={onGramGroupChange} wordCounts={gramCounts} />;
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ padding: "22px 24px 6px", flexShrink: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", color: "var(--cream)", marginBottom: 4 }}>L'Atelier</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 30, letterSpacing: "-0.5px", color: "var(--text)" }}>Øv</h1>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 2 }}>Velg en øvelse</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", paddingBottom: 24 }}>
        {HUB_SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="hub-section-title">{section.title}</h2>
            {selectorFor(section.groupKey)}
            <div>
              {section.items.map(item => (
                <button key={item.id} className="hub-row" onClick={() => onStart(item.id)}>
                  <span className="hub-row-icon">
                    <item.Icon size={18} stroke="var(--accent)" sw={1.6} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px" }}>{item.label}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--text-subtle)", marginTop: 1, lineHeight: 1.3 }}>{item.sub}</span>
                  </span>
                  <IcoArrow size={16} stroke="var(--text-muted)" sw={1.5} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav {...navProps} />
    </div>
  );
}
