import { useState, useRef, useCallback } from "react";

export function useVoiceRecognition() {
  const [status, setStatus] = useState("idle"); // "idle" | "listening" | "unsupported"
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const startListening = useCallback((onResult, timeoutMs = 6000) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus("unsupported"); return; }

    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = true;       // keep mic open — catches short words
    r.interimResults = true;   // capture partial results too
    r.maxAlternatives = 5;

    let bestResult = "";

    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const alts = Array.from(e.results[i]).map(a => a.transcript);
          bestResult = alts.join("|");
          // Got a final result — stop immediately
          clearTimeout(timerRef.current);
          r.stop();
          return;
        }
      }
    };

    r.onstart = () => {
      setStatus("listening");
      // Auto-stop after timeout if no final result
      timerRef.current = setTimeout(() => r.stop(), timeoutMs);
    };

    r.onerror = (e) => {
      clearTimeout(timerRef.current);
      // "no-speech" is normal for short words — still fire onResult with whatever we got
      if (e.error !== "aborted") setStatus("idle");
    };

    r.onend = () => {
      clearTimeout(timerRef.current);
      setStatus("idle");
      if (bestResult) onResult(bestResult);
      else onResult(""); // empty = nothing heard
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
