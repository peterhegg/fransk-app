import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle, getQuizOptions, logGameSession, loadUserProfile } from "../utils.jsx";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import BottomNav from "../components/BottomNav.jsx";
import { GameHeader, GameProgress, GameResult, LoadingState, OptionButton, AudioButton, Dock, PrimaryButton, GhostButton } from "../components/GameUI.jsx";

const ROUNDS = 8;

function levelInstructions(level) {
  const l = level || "A1/A2";
  if (l === "A1") return "Maks 6 ord per setning. Kun presens, enkle pronomen.";
  if (l === "A1/A2") return "Maks 8 ord per setning. Presens, enkel negasjon, vanlige pronomen.";
  if (l === "A2") return "Maks 9 ord. Presens og passé composé, negasjon, spørsmål.";
  return "8-12 ord. Bruk passé composé, imparfait og enkle konjunksjoner.";
}

async function fetchListeningSentences(words, grammarWords) {
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 40);
  const wordList = sample.map(w => `${w.fr} = ${w.no}`).join(", ");
  const profile = loadUserProfile();
  const lvl = profile.level || "A1/A2";
  const count = 8;
  const prompt = `Du lager norske lytteøvelser for en ${lvl}-elev i fransk. ORDBANK: ${wordList}

Lag ${count} korte franske setninger (${levelInstructions(lvl)}).

For HVER setning: lag 3 norske feilalternativer som er MINIMALE VARIASJONER av den riktige oversettelsen.

STRENG REGEL: Hvert feilalternativ MÅ dele minst 70 % av ordene med den riktige oversettelsen. Endre KUN 1 ord av gangen: subjektet, verbet, objektet eller en preposisjon.

GODT EKSEMPEL:
fr: "Elle achète du pain à la boulangerie."
no: "Hun kjøper brød i bakeriet."
wrong: ["Han kjøper brød i bakeriet.", "Hun selger brød i bakeriet.", "Hun kjøper melk i bakeriet."]

DÅRLIG EKSEMPEL (aldri gjør dette):
fr: "Elle achète du pain à la boulangerie."
no: "Hun kjøper brød i bakeriet."
wrong: ["De hørte musikk ute.", "Han løp raskt hjem.", "Vi spiste middag i går."]

Svar KUN med JSON-array, ingen markdown:
[{"fr":"...","no":"...","wrong":["...","...","..."]}]`;

  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: "You are a French language teacher. Respond only with a valid JSON array, no markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);
  return Array.isArray(parsed) ? parsed.filter(s => s.no && s.fr && Array.isArray(s.wrong) && s.wrong.length >= 2) : null;
}

function buildWordRound(word, allWords) {
  const opts = getQuizOptions(word, allWords, false);
  const correct = word.no.split(/\s*\/\s*/)[0].trim();
  return { fr: word.fr, correct, options: opts };
}

function buildSentenceRound(sentence) {
  const correct = sentence.no;
  const distractors = shuffle([...sentence.wrong]).slice(0, 3);
  return { fr: sentence.fr, correct, options: shuffle([correct, ...distractors]) };
}

export default function LyttedetektivScreen({ words, grammarWords, onBack, speak, speaking, isOnline, screen, showWords, onNav }) {
  const [phase, setPhase] = useState("mode");
  const [gameMode, setGameMode] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const lockedRef = useRef(false);
  const hasSpokenRef = useRef(false);

  const nav = <BottomNav screen={screen} showWords={showWords} onNav={onNav} />;
  const current = rounds[idx] || null;

  const playAudio = useCallback(() => {
    if (current) speak(current.fr, gameMode === "ord" ? 0.75 : 0.8);
  }, [current, speak, gameMode]);

  useEffect(() => {
    if (phase === "play" && current && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      setTimeout(() => playAudio(), 500);
    }
  }, [phase, idx]);

  useEffect(() => {
    hasSpokenRef.current = false;
  }, [idx]);

  const startOrd = () => {
    const pool = shuffle([...words, ...(grammarWords || [])]);
    const chosen = pool.slice(0, ROUNDS);
    if (!chosen.length) return;
    const allWords = [...words, ...(grammarWords || [])];
    setRounds(chosen.map(w => buildWordRound(w, allWords)));
    setGameMode("ord");
    setPhase("play");
  };

  const startSetning = async () => {
    if (!isOnline) { setLoadError(true); return; }
    setGameMode("setning");
    setPhase("loading");
    try {
      const sentences = await fetchListeningSentences(words, grammarWords || []);
      if (!sentences || sentences.length < 4) { setLoadError(true); setPhase("mode"); return; }
      const chosen = shuffle(sentences).slice(0, ROUNDS);
      setRounds(chosen.map(s => buildSentenceRound(s)));
      setPhase("play");
    } catch {
      setLoadError(true);
      setPhase("mode");
    }
  };

  const handleAnswer = (opt) => {
    if (lockedRef.current || selected !== null) return;
    lockedRef.current = true;
    setSelected(opt);
    if (opt === current.correct) setScore(s => s + 1);
    else setWrong(w => w + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= rounds.length) {
      logGameSession(rounds.length);
      setPhase("done");
    } else {
      setIdx(i => i + 1);
      setSelected(null);
      lockedRef.current = false;
    }
  };

  const restart = (mode) => {
    setRounds([]);
    setIdx(0);
    setSelected(null);
    setScore(0);
    setWrong(0);
    setLoadError(false);
    lockedRef.current = false;
    hasSpokenRef.current = false;
    if (mode === "ord") { setPhase("mode"); startOrd(); }
    else { setPhase("mode"); }
  };

  // ── Mode ──────────────────────────────────────────────────────────────────
  if (phase === "mode") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 28 }}>
        <div style={{ fontSize: 56 }}>🔊</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.5px" }}>Lyttedetektiv</div>
          <div style={{ fontSize: 14, color: "var(--text-subtle)", marginTop: 8, fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
            Hør fransklyden — velg riktig norsk.
          </div>
        </div>
        {loadError && (
          <div style={{ fontSize: 13, color: "var(--color-error)", fontFamily: "var(--font-body)", textAlign: "center" }}>
            Nettverksfeil. Prøv igjen eller velg ord-modus.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
          <button onClick={startOrd} className="press" style={{ flex: 1, padding: "20px 12px", background: "rgba(251,191,36,0.12)", border: "2px solid var(--color-streak)", borderRadius: 18, cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-streak)", fontFamily: "var(--font-body)" }}>Ord</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4, fontFamily: "var(--font-body)", lineHeight: 1.4 }}>Hør et ord,<br />velg norsk</div>
          </button>
          <button onClick={startSetning} disabled={!isOnline} className="press" style={{ flex: 1, padding: "20px 12px", background: isOnline ? "var(--color-info-bg)" : "var(--surface)", border: `2px solid ${isOnline ? "var(--color-info)" : "var(--border)"}`, borderRadius: 18, cursor: isOnline ? "pointer" : "not-allowed", textAlign: "center", opacity: isOnline ? 1 : 0.5 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-info)", fontFamily: "var(--font-body)" }}>Setning</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4, fontFamily: "var(--font-body)", lineHeight: 1.4 }}>Hør AI-setning,<br />velg norsk</div>
          </button>
        </div>
        <button onClick={onBack} className="press" style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Tilbake</button>
      </div>
      {nav}
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") return <LoadingState label="Lager setninger…" bottomNav={nav} />;

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = Math.round((score / rounds.length) * 100);
    const icon = pct >= 80 ? "🏅" : pct >= 50 ? "👍" : "🎧";
    const title = pct >= 80 ? "Utmerket lytting!" : pct >= 50 ? "Bra jobbet!" : "Øv mer på lytting!";
    return (
      <GameResult
        icon={icon}
        title={title}
        stats={[
          { label: "Riktige", value: score, tone: "success" },
          { label: "Feil",    value: wrong, tone: "error" },
          { label: "Prosent", value: `${pct}%`, tone: "accent" },
        ]}
        primary={{ label: "Spill igjen", onClick: () => restart(gameMode) }}
        secondary={{ label: "Bytt modus", onClick: () => { setPhase("mode"); setLoadError(false); setIdx(0); setScore(0); setWrong(0); setSelected(null); lockedRef.current = false; } }}
        tertiary={{ label: "Hjem", onClick: onBack }}
        bottomNav={nav}
      />
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  const showFeedback = selected !== null;
  const isCorrect = selected === current?.correct;
  const isSentenceMode = gameMode === "setning";

  const optionState = (opt) => {
    if (!showFeedback) return "idle";
    if (opt === current.correct) return "reveal";
    if (opt === selected) return "wrong";
    return "disabled";
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", paddingBottom: 188 }}>
      <GameHeader
        onBack={onBack}
        backLabel="Avslutt"
        title={gameMode === "ord" ? "♪ Ord" : "🎙 Setning"}
        right={<span style={{ fontSize: 13, color: "var(--color-success)", fontFamily: "var(--font-body)", fontWeight: 600 }}>{score}/{rounds.length}</span>}
      />

      <GameProgress total={rounds.length} current={idx} />

      {/* Audio card */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--font-body)" }}>
            Hva sier de?
          </div>
          <AudioButton
            playing={speaking}
            onClick={playAudio}
            onSlow={() => current && speak(current.fr, 0.45)}
          />
          {showFeedback && (
            <div style={{ fontSize: 13, color: isCorrect ? "var(--color-success)" : "var(--color-error)", fontFamily: "var(--font-body)", fontWeight: 500, textAlign: "center" }}>
              {current.fr}
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div style={{
        padding: "0 20px",
        display: isSentenceMode ? "flex" : "grid",
        flexDirection: "column",
        gridTemplateColumns: isSentenceMode ? undefined : "1fr 1fr",
        gap: 10,
      }}>
        {current?.options.map(opt => (
          <OptionButton
            key={opt}
            state={optionState(opt)}
            onClick={() => !showFeedback && handleAnswer(opt)}
            align={isSentenceMode ? "left" : "center"}
            style={{ fontSize: opt.length > 30 ? 12 : opt.length > 15 ? 13 : 15 }}
          >
            {opt}
          </OptionButton>
        ))}
      </div>

      {showFeedback && (
        <Dock>
          <PrimaryButton onClick={handleNext} style={{ flex: 1 }}>
            {idx + 1 >= rounds.length ? "Se resultat" : "Neste →"}
          </PrimaryButton>
        </Dock>
      )}

      {nav}
    </div>
  );
}
