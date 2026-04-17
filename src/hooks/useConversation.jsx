import { useState, useCallback, useRef } from "react";
import { useVoiceRecognition } from "./useVoiceRecognition.jsx";
import { useSpeechSynthesis } from "./useSpeechSynthesis.jsx";
import { PROXY_URL, APP_TOKEN } from "../constants.js";

const VOICE_URL = PROXY_URL ? `${PROXY_URL.replace(/\/$/, "")}/voice` : "/voice";

export function useConversation() {
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("idle"); // "idle" | "listening" | "thinking" | "speaking"
  const [currentCorrection, setCurrentCorrection] = useState(null);
  const [estimatedLevel] = useState("A2");

  const historyRef = useRef([]);
  const pendingCorrectionRef = useRef(null);

  const { status: recStatus, startListening: startRec, stopListening: stopRec } = useVoiceRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  const pushMessage = (msg) => {
    historyRef.current = [...historyRef.current, msg];
    setHistory([...historyRef.current]);
  };

  const sendToApi = useCallback(async (userMessage) => {
    setStatus("thinking");
    setCurrentCorrection(null);
    pushMessage({ role: "user", content: userMessage });

    try {
      const res = await fetch(VOICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Token": APP_TOKEN,
        },
        body: JSON.stringify({
          history: historyRef.current.slice(-20),
          userMessage,
        }),
      });

      if (!res.ok) { setStatus("idle"); return; }
      const data = await res.json();
      if (!data.reply) { setStatus("idle"); return; }

      pushMessage({ role: "assistant", content: data.reply });
      pendingCorrectionRef.current = data.correction || null;

      setStatus("speaking");
      speak(data.reply, {
        onEnd: () => {
          setStatus("idle");
          if (pendingCorrectionRef.current) {
            setCurrentCorrection(pendingCorrectionRef.current);
            pendingCorrectionRef.current = null;
          }
        },
      });
    } catch {
      setStatus("idle");
    }
  // setHistory and pushMessage use stable refs/setters — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak]);

  const startListening = useCallback(() => {
    if (isSpeaking) stopSpeaking();
    setCurrentCorrection(null);
    setStatus("listening");
    startRec(sendToApi);
  }, [isSpeaking, stopSpeaking, startRec, sendToApi]);

  const stopListening = useCallback(() => {
    stopRec();
  }, [stopRec]);

  const reset = useCallback(() => {
    stopSpeaking();
    historyRef.current = [];
    setHistory([]);
    setStatus("idle");
    setCurrentCorrection(null);
    pendingCorrectionRef.current = null;
  }, [stopSpeaking]);

  return {
    history,
    status,
    currentCorrection,
    estimatedLevel,
    startListening,
    stopListening,
    reset,
  };
}
