// Single text-to-speech engine for the whole app (browser speechSynthesis).
// Every screen goes through here so voice choice, Android quirks and long-text
// handling live in one place.
import { speechLocale, voicePrefix } from "./content.js";

let voices = [];
let voicesBound = false;
let current = null; // { done, text, chunks, i, utt, fallback, keepAlive }
const listeners = new Set();

function loadVoices() {
  voices = window.speechSynthesis?.getVoices() || [];
}

function bindVoices() {
  if (voicesBound || !window.speechSynthesis) return;
  voicesBound = true;
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

// Android Chrome reports voice.lang as "fr_FR"; iOS/desktop use "fr-FR".
const norm = (l) => (l || "").replace("_", "-").toLowerCase();
const QUALITY = /google|enhanced|premium|natural|neural/i;

export function pickVoice() {
  bindVoices();
  if (!voices.length) loadVoices();
  const exact = voices.filter(v => norm(v.lang) === norm(speechLocale));
  const pool = exact.length ? exact : voices.filter(v => norm(v.lang).startsWith(voicePrefix.toLowerCase()));
  return pool.find(v => QUALITY.test(v.name)) || pool[0] || null;
}

function cleanText(text) {
  return String(text || "")
    .replace(/\*\*?(.+?)\*\*?/g, "$1")
    .replace(/[✓✗][^:]*:/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

// Chrome cuts long utterances (~15 s) — speak sentence-sized chunks in turn.
function chunkText(text, max = 220) {
  const sentences = text.split(/(?<=[.!?…])\s+/);
  const chunks = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && (buf + " " + s).length > max) { chunks.push(buf); buf = s; }
    else buf = buf ? buf + " " + s : s;
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function notify(speaking) {
  listeners.forEach(fn => fn(speaking));
}

export function subscribeSpeaking(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isSpeaking = () => !!current;
export const isSpeakingText = (text) => !!current && current.text === cleanText(text);

function clearCall(call) {
  call.done = true;
  clearTimeout(call.fallback);
  clearInterval(call.keepAlive);
  if (current === call) current = null;
}

function playNext(call, rate, onEnd) {
  const synth = window.speechSynthesis;
  if (call.done) return;
  if (call.i >= call.chunks.length) {
    clearCall(call);
    notify(false);
    onEnd?.();
    return;
  }
  const chunk = call.chunks[call.i++];
  const utt = new SpeechSynthesisUtterance(chunk);
  utt.lang = speechLocale;
  utt.rate = rate;
  const voice = pickVoice();
  if (voice) utt.voice = voice;
  call.utt = utt;

  // Fallback if onend never fires (Chrome/Safari bug).
  clearTimeout(call.fallback);
  const estimatedMs = Math.max(chunk.split(/\s+/).length / (2.5 * rate) * 1000, 2000) + 5000;
  call.fallback = setTimeout(() => {
    if (call.done || call.utt !== utt) return;
    synth.cancel();
    playNext(call, rate, onEnd);
  }, estimatedMs);

  utt.onend = () => { if (call.utt === utt) playNext(call, rate, onEnd); };
  // "interrupted" = our own cancel() from stop()/the next speak(); the caller
  // that interrupted drives what happens next, so don't fire onEnd for it.
  utt.onerror = (e) => {
    if (call.done || call.utt !== utt || e.error === "interrupted") return;
    clearCall(call);
    notify(false);
    onEnd?.();
  };
  synth.speak(utt);
}

export function speak(text, { rate = 0.85, onEnd } = {}) {
  const synth = window.speechSynthesis;
  const clean = cleanText(text);
  if (!synth || !clean) { onEnd?.(); return; }
  bindVoices();

  if (current) clearCall(current);
  const call = { done: false, text: clean, chunks: chunkText(clean), i: 0, utt: null, fallback: null, keepAlive: null };
  current = call;
  notify(true);
  synth.cancel();

  // Chrome Android pauses TTS after ~1 s — poll to resume immediately.
  call.keepAlive = setInterval(() => { if (synth.paused) synth.resume(); }, 250);

  // Chrome Android needs a brief pause after cancel before speak works.
  setTimeout(() => playNext(call, rate, onEnd), 50);
}

export function stop() {
  if (current) clearCall(current);
  window.speechSynthesis?.cancel();
  notify(false);
}
