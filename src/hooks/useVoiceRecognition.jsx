import { useState, useRef, useCallback } from "react";

export function useVoiceRecognition() {
  const [status, setStatus] = useState("idle"); // "idle" | "listening" | "unsupported"
  const recognitionRef = useRef(null);

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus("unsupported"); return; }

    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    let heard = "";
    r.onresult = (e) => { heard = e.results[0][0].transcript; };
    r.onstart = () => setStatus("listening");
    r.onerror = () => setStatus("idle");
    r.onend = () => {
      setStatus("idle");
      if (heard) onResult(heard);
    };

    recognitionRef.current = r;
    r.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { status, startListening, stopListening };
}
