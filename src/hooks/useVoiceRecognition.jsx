import { useState, useRef, useCallback, useEffect } from "react";
import { speechLocale } from "../content.js";

const ERROR_TEXT = {
  "not-allowed": "Mikrofontilgang er blokkert. Tillat mikrofon i nettleserinnstillingene.",
  "service-not-allowed": "Mikrofontilgang er blokkert. Tillat mikrofon i nettleserinnstillingene.",
  "audio-capture": "Fant ingen mikrofon.",
  network: "Ingen kontakt med talegjenkjenningen. Sjekk nettet og prøv igjen.",
  "no-speech": "Ingenting ble fanget opp — si det litt høyere.",
  unsupported: "Talegjenkjenning støttes ikke i denne nettleseren.",
};

export function micErrorText(code) {
  return code ? (ERROR_TEXT[code] || "Talegjenkjenning feilet. Prøv igjen.") : "";
}

function detach(r) {
  if (!r) return;
  r.onresult = r.onstart = r.onerror = r.onend = null;
  try { r.abort(); } catch {}
}

export function useVoiceRecognition() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const startListening = useCallback((onResult, {
    timeoutMs = 7000,
    hintWord = null,
    shouldStopEarly = null,
    continuous = true,
    accumulateFinals = false,
    silenceMs = 2000,
  } = {}) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus("unsupported"); setError("unsupported"); return; }

    detach(recognitionRef.current);
    setError(null);
    let errorCode = null;

    const r = new SR();
    r.lang = speechLocale;
    r.continuous = continuous;
    r.interimResults = true;
    r.maxAlternatives = 5;

    // Grammar hint — massively improves short-word recognition
    if (hintWord) {
      const GL = window.SpeechGrammarList || window.webkitSpeechGrammarList;
      if (GL) {
        const grammar = `#JSGF V1.0; grammar word; public <word> = ${hintWord};`;
        const list = new GL();
        list.addFromString(grammar, 1);
        r.grammars = list;
      }
    }

    let finalTranscript = "";
    let bestInterim = "";
    const accumulatedFinals = [];

    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const alts = Array.from(e.results[i]).map(a => a.transcript);
        if (e.results[i].isFinal) {
          if (accumulateFinals) {
            // Accumulate finals; reset silence timer after each recognized chunk
            accumulatedFinals.push(alts[0].trim());
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => r.stop(), silenceMs);
          } else {
            finalTranscript = alts.join("|");
            clearTimeout(timerRef.current);
            r.stop();
          }
          return;
        } else {
          if (alts[0] && alts[0].trim().length > 0) {
            bestInterim = alts.join("|");
            if (shouldStopEarly && shouldStopEarly(bestInterim)) {
              finalTranscript = bestInterim;
              clearTimeout(timerRef.current);
              r.stop();
              return;
            }
          }
        }
      }
    };

    r.onstart = () => {
      setStatus("listening");
      timerRef.current = setTimeout(() => r.stop(), timeoutMs);
    };

    r.onerror = (e) => {
      clearTimeout(timerRef.current);
      clearTimeout(silenceTimerRef.current);
      if (e.error !== "aborted") { errorCode = e.error; setStatus("idle"); }
    };

    r.onend = () => {
      clearTimeout(timerRef.current);
      clearTimeout(silenceTimerRef.current);
      setStatus("idle");
      const result = accumulateFinals
        ? (accumulatedFinals.join(" ") || bestInterim)
        : (finalTranscript || bestInterim);
      const code = errorCode || (result.trim() ? null : "no-speech");
      setError(code);
      onResult(result, { error: code });
    };

    recognitionRef.current = r;
    try {
      r.start();
    } catch {
      recognitionRef.current = null;
      setStatus("idle");
      setError("audio-capture");
    }
  }, []);

  const stopListening = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
  }, []);

  // Release the mic on unmount without firing onResult into a dead screen.
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(silenceTimerRef.current);
    detach(recognitionRef.current);
  }, []);

  return { status, error, startListening, stopListening };
}
