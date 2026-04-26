import { useState, useRef, useCallback } from "react";

export function useVoiceRecognition() {
  const [status, setStatus] = useState("idle");
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const startListening = useCallback((onResult, { timeoutMs = 7000, hintWord = null } = {}) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus("unsupported"); return; }

    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = true;
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

    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const alts = Array.from(e.results[i]).map(a => a.transcript);
        if (e.results[i].isFinal) {
          finalTranscript = alts.join("|");
          clearTimeout(timerRef.current);
          r.stop();
          return;
        } else {
          // Keep best interim as fallback for short words
          if (alts[0] && alts[0].trim().length > 0) {
            bestInterim = alts.join("|");
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
      if (e.error !== "aborted") setStatus("idle");
    };

    r.onend = () => {
      clearTimeout(timerRef.current);
      setStatus("idle");
      const result = finalTranscript || bestInterim;
      onResult(result);
    };

    recognitionRef.current = r;
    r.start();
  }, []);

  const stopListening = useCallback(() => {
    clearTimeout(timerRef.current);
    recognitionRef.current?.stop();
  }, []);

  return { status, startListening, stopListening };
}
