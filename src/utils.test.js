import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  dateStr, todayStr, touchStreak, loadStreak, checkQuizAnswer,
  applyAnswerToWord, selectExerciseWords, loadWords, saveUserProfile, DEFAULT_PROFILE,
} from "./utils.jsx";
import { parseBackup } from "./backup.js";

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe("dateStr", () => {
  it("steps whole calendar days across the spring DST changeover", () => {
    // Europe/Oslo DST starts 2026-03-29; the local calendar must still advance by 1.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 30, 0, 30)); // 30 Mar, 00:30 local
    expect(dateStr(-1)).toBe("2026-03-29");
    expect(dateStr(-2)).toBe("2026-03-28");
  });
  it("todayStr matches local date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 23, 59));
    expect(todayStr()).toBe("2026-01-05");
  });
});

describe("touchStreak", () => {
  it("continues on consecutive days and resets after a gap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1, 12));
    expect(touchStreak()).toBe(1);
    vi.setSystemTime(new Date(2026, 5, 2, 12));
    expect(touchStreak()).toBe(2);
    vi.setSystemTime(new Date(2026, 5, 4, 12));
    expect(touchStreak()).toBe(1);
    expect(loadStreak().current).toBe(1);
  });
});

describe("checkQuizAnswer", () => {
  const card = { fr: "café", no: "kaffe" };
  it("accepts diacritic-free French by default", () => {
    expect(checkQuizAnswer("cafe", card, true)).toBe("correct");
  });
  it("marks accent slips as close when strictAccents is on", () => {
    saveUserProfile({ ...DEFAULT_PROFILE, strictAccents: true });
    expect(checkQuizAnswer("cafe", card, true)).toBe("close");
    expect(checkQuizAnswer("café", card, true)).toBe("correct");
  });
  it("does not apply accent strictness to Norwegian answers", () => {
    saveUserProfile({ ...DEFAULT_PROFILE, strictAccents: true });
    expect(checkQuizAnswer("kaffe", card, false)).toBe("correct");
  });
  it("rejects unrelated answers", () => {
    expect(checkQuizAnswer("banan", card, true)).toBe("wrong");
  });
});

describe("applyAnswerToWord", () => {
  it("schedules the next review after a correct answer", () => {
    const w = { id: 1, fr: "chat", no: "katt", points: 0, level: 0, nextReview: 0 };
    const out = applyAnswerToWord(w, "correct", 10);
    expect(out.points).toBe(1);
    expect(out.level).toBe(1);
    expect(out.nextReview).toBeGreaterThan(Date.now());
  });
  it("leaves the word untouched on a close answer", () => {
    const w = { id: 1, fr: "chat", no: "katt", points: 3, level: 2, nextReview: 5 };
    expect(applyAnswerToWord(w, "close", 10)).toEqual(w);
  });
});

describe("selectExerciseWords", () => {
  it("returns due words first within the same tier", () => {
    const past = Date.now() - 1000;
    const future = Date.now() + 86400000;
    const words = Array.from({ length: 30 }, (_, i) => ({
      id: i, fr: `w${i}`, no: `n${i}`, points: 0, nextReview: i < 5 ? past : future,
    }));
    const picked = selectExerciseWords(words, 5).map(w => w.id).sort((a, b) => a - b);
    expect(picked).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("corrupt word bank", () => {
  it("stashes the raw value instead of losing it", () => {
    localStorage.setItem("fransk-laering-ord-v2", "{not json");
    expect(loadWords()).toEqual([]);
    expect(localStorage.getItem("fransk-laering-ord-v2-corrupt-backup")).toBe("{not json");
  });
});

describe("parseBackup", () => {
  it("accepts a valid backup and drops device-level keys", () => {
    const text = JSON.stringify({ app: "sprakappen", version: 1, data: { "fransk-streak": "{}", "fransk-widget-uuid": "abc" } });
    expect(parseBackup(text)).toEqual({ "fransk-streak": "{}" });
  });
  it("rejects foreign or malformed files", () => {
    expect(() => parseBackup("nope")).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: "other", data: {} }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ app: "sprakappen", data: { a: 1 } }))).toThrow();
  });
});
