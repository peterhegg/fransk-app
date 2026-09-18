import { useState, useEffect, useCallback } from "react";
import { speak as ttsSpeak, stop as ttsStop, subscribeSpeaking, isSpeaking as ttsIsSpeaking } from "../tts.js";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(ttsIsSpeaking);
  useEffect(() => subscribeSpeaking(setIsSpeaking), []);

  const speak = useCallback((text, { rate = 0.85, onEnd } = {}) => ttsSpeak(text, { rate, onEnd }), []);
  const stop = useCallback(() => ttsStop(), []);

  return { speak, stop, isSpeaking };
}
