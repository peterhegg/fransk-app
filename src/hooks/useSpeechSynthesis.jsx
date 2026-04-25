import { useState, useRef, useCallback, useEffect } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef([]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback((text, { rate = 0.85, onEnd } = {}) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "fr-FR";
    utt.rate = rate;

    const frVoice = voicesRef.current.find(v => v.lang === "fr-FR")
                 || voicesRef.current.find(v => v.lang.startsWith("fr"));
    if (frVoice) utt.voice = frVoice;

    // Fallback if onend never fires (Chrome/Safari bug)
    const wordsPerSec = 2.5 * rate;
    const estimatedMs = Math.max(text.split(/\s+/).length / wordsPerSec * 1000, 2000) + 5000;
    let done = false;

    const fallbackTimer = setTimeout(() => {
      if (!done) {
        done = true;
        clearInterval(keepAlive);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        onEnd?.();
      }
    }, estimatedMs);

    // Chrome pauses TTS when tab goes to background
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 5000);

    const finish = () => {
      if (!done) {
        done = true;
        clearTimeout(fallbackTimer);
        clearInterval(keepAlive);
        setIsSpeaking(false);
        onEnd?.();
      }
    };

    utt.onstart = () => setIsSpeaking(true);
    utt.onend = finish;
    utt.onerror = (e) => { if (e.error !== "interrupted") finish(); };

    window.speechSynthesis.speak(utt);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
