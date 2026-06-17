import { useState, useRef, useEffect } from "react";
import { touchStreak, shuffle, checkQuizAnswer, updateWordPoints, logWordAnswer, loadAnswerCount, saveWords, loadUserProfile } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { AutoPlayToggle } from "../components/AudioControls.jsx";
import AiFeedback from "../components/AiFeedback.jsx";

const ARTICLE_OPTIONS = ["le", "la", "les", "l'"];

const FORM_TYPE_LABELS = {
  pr: "Présent", pc: "Passé composé", imp: "Imparfait",
  f: "Futur", c: "Conditionnel", impv: "Impératif", pp: "Participe passé",
};

const TOPIC_FORM_TYPE = {
  etre: "pr", avoir: "pr", "er-verbs": "pr", reflexifs: "pr",
  "futur-proche": "pr", "passe-compose": "pc", imperatif: "impv",
  imparfait: "imp", "imparfait-vs-passe": "imp", conditionnel: "c",
};

const TOPIC_VERB_TITLE = {
  etre: "être", avoir: "avoir", "er-verbs": "parler (-er verb)",
  "passe-compose": "passé composé", reflexifs: "se lever (refleksiv)",
  "futur-proche": "futur proche", imperatif: "impératif",
  imparfait: "imparfait", "imparfait-vs-passe": "imparfait / p.c.",
  conditionnel: "conditionnel",
};

const ARTICLE_TOPIC_IDS = new Set(["articles", "partitifs"]);

function extractArticle(form) {
  const m = form.match(/^(le|la|les|l')\s+(.+)$/i);
  return m ? { article: m[1], noun: m[2] } : null;
}

function buildArticleQueue(words, grammarWords = []) {
  const cards = [];
  for (const w of words) {
    if (!w.forms?.length) continue;
    for (const [form, type] of w.forms) {
      if (type !== "n") continue;
      const parsed = extractArticle(form);
      if (parsed) cards.push({ word: w, noun: parsed.noun, answer: parsed.article });
    }
  }
  for (const w of grammarWords) {
    if (!ARTICLE_TOPIC_IDS.has(w.topicId)) continue;
    const parsed = extractArticle(w.fr);
    if (parsed) cards.push({ word: w, noun: parsed.noun, answer: parsed.article });
  }
  return shuffle(cards).slice(0, 15);
}

function buildConjugationQueue(words, grammarWords = []) {
  const verbTypes = new Set(["pr", "pc", "imp", "f", "c", "impv"]);
  const cards = [];
  for (const w of words) {
    if (!w.forms?.length) continue;
    for (const [form, type] of w.forms) {
      if (!verbTypes.has(type)) continue;
      cards.push({ word: w, form, formType: type });
    }
  }
  for (const w of grammarWords) {
    const ft = TOPIC_FORM_TYPE[w.topicId];
    if (!ft) continue;
    cards.push({
      word: { fr: TOPIC_VERB_TITLE[w.topicId] || w.topicId, no: w.no },
      form: w.fr,
      formType: ft,
      isGrammarPair: true,
    });
  }
  return shuffle(cards).slice(0, 15);
}

export function ArticleExerciseScreen({ words, grammarWords = [], onBack, speak, autoPlay, onToggleAutoPlay, screen, showWords, onNav }) {
  const [queue, setQueue] = useState(() => buildArticleQueue(words, grammarWords));
  const [card, setCard] = useState(() => queue[0] || null);
  const [checked, setChecked] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [result, setResult] = useState("");
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const total = queue.length + stats.correct + stats.wrong;

  useEffect(() => {
    if (autoPlay && card?.noun && !checked) {
      const t = setTimeout(() => speak(card.noun), 400);
      return () => clearTimeout(t);
    }
  }, [card?.noun, checked]);

  const submit = (pick) => {
    if (checked || !card) return;
    setChosen(pick);
    const res = pick === card.answer ? "correct" : "wrong";
    setChecked(true); setResult(res);
    setStats(s => ({ correct: s.correct + (res !== "wrong" ? 1 : 0), wrong: s.wrong + (res === "wrong" ? 1 : 0) }));
    if (autoPlay) speak(card.noun);
  };

  const next = () => {
    const remaining = queue.slice(1);
    if (result === "wrong") {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...card }, ...remaining.slice(at)];
      setQueue(recycled); setCard(recycled[0]);
      setChecked(false); setChosen(null); setResult("");
      return;
    }
    if (!remaining.length) { touchStreak(); setDone(true); return; }
    setQueue(remaining); setCard(remaining[0]);
    setChecked(false); setChosen(null); setResult("");
  };

  const navBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <span style={{ color: "var(--text)", fontSize: 15 }}>⬡ Artikkeltest</span>
      <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
    </div>
  );

  if (!card || done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        {done ? (
          <>
            <div style={{ fontSize: 36 }}>✓</div>
            <div style={{ fontSize: 20, color: "var(--cream)", fontFamily: "var(--font-display)" }}>Ferdig! {stats.correct}/{total} riktige</div>
            <button onClick={onBack} style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "13px 28px", cursor: "pointer", marginTop: 8 }}>Tilbake</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 20, color: "var(--text-subtle)" }}>Ingen ord med artikkelformer ennå.</div>
            <div style={{ fontSize: 14, color: "var(--text-subtle)", opacity: 0.7 }}>Lær substantiver i Dagens øvelse.</div>
            <button onClick={onBack} style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "13px 28px", cursor: "pointer", marginTop: 8 }}>Tilbake</button>
          </>
        )}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  const pct = Math.round((stats.correct + stats.wrong) / (total || 1) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}
      <div style={{ height: 3, background: "var(--bg)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--cream)", borderRadius: 99, transition: "width 0.4s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 24 }}>
        <div style={{ fontSize: 13, color: "var(--text-subtle)" }}>{stats.correct + stats.wrong + 1} / {total}</div>

        <div style={{ background: "var(--surface)", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.8, marginBottom: 10 }}>Sett inn riktig artikkel:</div>
          <div style={{ fontSize: 36, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)", marginBottom: 4 }}>
            <span style={{ color: "var(--text-subtle)", opacity: 0.5 }}>___ </span>{card.noun}
          </div>
          {card.word.phonetic && <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.7, marginTop: 4 }}>({card.word.phonetic})</div>}
          <div style={{ fontSize: 14, color: "var(--text-subtle)", marginTop: 6 }}>{card.word.no}</div>

          {checked && (
            <div style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: result === "correct" ? "var(--color-success)" : "var(--color-error)" }}>
              {result === "correct" ? "Riktig!" : `Riktig: ${card.answer} ${card.noun}`}
            </div>
          )}
        </div>

        {!checked ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 380 }}>
            {ARTICLE_OPTIONS.map(opt => (
              <button key={opt} onClick={() => submit(opt)} style={{ background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 14, color: "var(--cream)", fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", padding: "18px 12px", cursor: "pointer", transition: "all 0.15s" }}>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 380, opacity: 0.4 }}>
              {ARTICLE_OPTIONS.map(opt => (
                <button key={opt} disabled style={{ background: chosen === opt ? (result === "correct" ? "rgba(100,200,100,0.2)" : "rgba(200,80,80,0.2)") : (opt === card.answer && result === "wrong" ? "rgba(100,200,100,0.2)" : "var(--surface)"), border: `2px solid ${chosen === opt ? (result === "correct" ? "var(--color-success)" : "var(--color-error)") : (opt === card.answer && result === "wrong" ? "var(--color-success)" : "var(--border)")}`, borderRadius: 14, color: "var(--cream)", fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", padding: "18px 12px", opacity: 1 }}>
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={next} style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "14px 40px", cursor: "pointer", width: "100%", maxWidth: 380 }}>
              {queue.length <= 1 ? "Fullfør" : "Neste →"}
            </button>
          </>
        )}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}

export function ConjugationExerciseScreen({ words, grammarWords = [], setWords, onBack, speak, autoPlay, onToggleAutoPlay, isOnline, screen, showWords, onNav }) {
  const [queue, setQueue] = useState(() => buildConjugationQueue(words, grammarWords));
  const [card, setCard] = useState(() => queue[0] || null);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState("");
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const total = queue.length + stats.correct + stats.wrong;

  useEffect(() => { if (!checked && inputRef.current) inputRef.current.focus(); }, [card, checked]);

  useEffect(() => {
    if (autoPlay && card?.word?.fr && !checked) {
      const t = setTimeout(() => speak(card.word.fr), 400);
      return () => clearTimeout(t);
    }
  }, [card?.word?.fr, checked]);

  const submit = () => {
    if (!input.trim() || !card || checked) return;
    const fakeCard = { fr: card.form, no: card.form };
    const res = checkQuizAnswer(input, fakeCard, true);
    setChecked(true); setResult(res);
    setStats(s => ({ correct: s.correct + (res !== "wrong" ? 1 : 0), wrong: s.wrong + (res === "wrong" ? 1 : 0) }));
    if (autoPlay) speak(card.form);
    if (res !== "close" && setWords) {
      const gc = loadAnswerCount();
      setWords(prev => {
        const updated = prev.map(w => {
          if (w.fr !== card.word.fr) return w;
          const u = updateWordPoints(w, res, gc);
          logWordAnswer(w.fr, w.no, w.phonetic || "", w.points || 0, u.points || 0, res);
          return u;
        });
        saveWords(updated);
        return updated;
      });
    }
  };

  const next = () => {
    const remaining = queue.slice(1);
    if (result === "wrong") {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...card }, ...remaining.slice(at)];
      setQueue(recycled); setCard(recycled[0]);
      setInput(""); setChecked(false); setResult("");
      return;
    }
    if (!remaining.length) { touchStreak(); setDone(true); return; }
    setQueue(remaining); setCard(remaining[0]);
    setInput(""); setChecked(false); setResult("");
  };

  const navBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <span style={{ color: "var(--text)", fontSize: 15 }}>⬡ Bøyingstest</span>
      <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
    </div>
  );

  if (!card || done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        {done ? (
          <>
            <div style={{ fontSize: 36 }}>✓</div>
            <div style={{ fontSize: 20, color: "var(--cream)", fontFamily: "var(--font-display)" }}>Ferdig! {stats.correct}/{total} riktige</div>
            <button onClick={onBack} style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "13px 28px", cursor: "pointer", marginTop: 8 }}>Tilbake</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 20, color: "var(--text-subtle)" }}>Ingen verb med bøyingsformer ennå.</div>
            <div style={{ fontSize: 14, color: "var(--text-subtle)", opacity: 0.7 }}>Lær verb i Dagens øvelse.</div>
            <button onClick={onBack} style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "13px 28px", cursor: "pointer", marginTop: 8 }}>Tilbake</button>
          </>
        )}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  const pct = Math.round((stats.correct + stats.wrong) / (total || 1) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}
      <div style={{ height: 3, background: "var(--bg)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--cream)", borderRadius: 99, transition: "width 0.4s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 20 }}>
        <div style={{ fontSize: 13, color: "var(--text-subtle)" }}>{stats.correct + stats.wrong + 1} / {total}</div>

        <div style={{ background: "var(--surface)", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 12, color: "var(--cream-deep)", opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            {FORM_TYPE_LABELS[card.formType] || card.formType}
            {card.isGrammarPair && <span style={{ opacity: 0.6 }}> · {card.word.fr}</span>}
          </div>
          {card.isGrammarPair ? (
            <>
              <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.7, marginBottom: 6 }}>Skriv på fransk:</div>
              <div style={{ fontSize: 28, color: "var(--text)", fontFamily: "var(--font-display)", marginBottom: 4 }}>{card.word.no}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)", marginBottom: 4 }}>{card.word.fr}</div>
              {card.word.phonetic && <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.7 }}>({card.word.phonetic})</div>}
              <div style={{ fontSize: 14, color: "var(--text-subtle)", marginTop: 4 }}>{card.word.no}</div>
            </>
          )}

          {checked && (
            <div style={{ marginTop: 14, padding: "10px 16px", borderRadius: 10, background: result === "correct" ? "rgba(100,200,100,0.1)" : "rgba(200,80,80,0.1)", fontSize: 15 }}>
              <span style={{ color: result === "correct" ? "var(--color-success)" : "var(--color-error)", fontWeight: 600 }}>{result === "correct" ? "Riktig!" : "Riktig svar:"}</span>
              {result !== "correct" && <span style={{ color: "var(--text)", fontStyle: "italic", marginLeft: 8 }}>{card.form}</span>}
            </div>
          )}
        </div>

        {!checked ? (
          <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder={`Skriv ${FORM_TYPE_LABELS[card.formType]?.toLowerCase() || "bøyingsform"}…`}
              lang="fr"
              style={{ background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 14, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", padding: "16px 18px", outline: "none", width: "100%", boxSizing: "border-box", textAlign: "center" }}
            />
            <button onClick={submit} disabled={!input.trim()} style={{ background: input.trim() ? "var(--cream)" : "var(--bg)", border: "none", borderRadius: 14, color: input.trim() ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default", transition: "all 0.2s" }}>
              Sjekk
            </button>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            {(result === "wrong" || result === "close") && (
              <AiFeedback
                isOnline={isOnline}
                resetKey={`${card.word.fr}-${card.form}`}
                buildPrompt={() => {
                  const lvl = loadUserProfile().level || "A1/A2";
                  return `Norsk ${lvl}-elev svarte galt på en bøyingstest (${FORM_TYPE_LABELS[card.formType] || card.formType}).\nVerb: ${card.word.fr} (${card.word.no})\nRiktig bøyingsform: "${card.form}"\nEleven svarte: "${input}"\n\nForklar på norsk (2 korte setninger) SPESIFIKT hva som er galt med bøyingen — for akkurat dette verbet og denne tiden. Gi én huskeregel knyttet direkte til denne formen.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`;
                }}
              />
            )}
            <button onClick={next} style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, padding: "14px", cursor: "pointer", width: "100%" }}>
              {queue.length <= 1 ? "Fullfør" : "Neste →"}
            </button>
          </div>
        )}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
