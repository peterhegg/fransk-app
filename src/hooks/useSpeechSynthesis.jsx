import { useState, useRef, useCallback, useEffect } from "react";
import { speechLocale, voicePrefix } from "../content.js";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef([]);
  const activeRef = useRef(null);

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

    // Chrome Android needs a brief pause after cancel before speak works
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = speechLocale;
      utt.rate = rate;

      const voice = voicesRef.current.find(v => v.lang === speechLocale)
                 || voicesRef.current.find(v => v.lang.startsWith(voicePrefix));
      if (voice) utt.voice = voice;

      // Fallback if onend never fires (Chrome/Safari bug)
      const wordsPerSec = 2.5 * rate;
      const estimatedMs = Math.max(text.split(/\s+/).length / wordsPerSec * 1000, 2000) + 5000;
      // Timer/interval handles live on this call's own object so stop() can
      // clear them directly instead of relying on onerror("interrupted"),
      // which never fires for a plain stop() (only when a new speak() cancels us).
      const call = { done: false, fallbackTimer: null, keepAlive: null };
      activeRef.current = call;

      const finish = () => {
        if (call.done) return;
        call.done = true;
        clearTimeout(call.fallbackTimer);
        clearInterval(call.keepAlive);
        if (activeRef.current === call) activeRef.current = null;
        setIsSpeaking(false);
        onEnd?.();
      };

      call.fallbackTimer = setTimeout(() => {
        window.speechSynthesis.cancel();
        finish();
      }, estimatedMs);

      // Chrome Android pauses TTS after ~1s — poll at 250ms to resume immediately
      call.keepAlive = setInterval(() => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 250);

      utt.onstart = () => setIsSpeaking(true);
      utt.onend = finish;
      // "interrupted" fires when cancel() is called by the next speak()/stop() —
      // still clean up this call's own timer/interval, just skip its onEnd
      // (the caller that interrupted us drives what happens next).
      utt.onerror = (e) => {
        if (e.error !== "interrupted") { finish(); return; }
        if (call.done) return;
        call.done = true;
        clearTimeout(call.fallbackTimer);
        clearInterval(call.keepAlive);
        if (activeRef.current === call) activeRef.current = null;
      };

      window.speechSynthesis.speak(utt);
    }, 50);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    const call = activeRef.current;
    if (call) {
      call.done = true;
      clearTimeout(call.fallbackTimer);
      clearInterval(call.keepAlive);
      activeRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
