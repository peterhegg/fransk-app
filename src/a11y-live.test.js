// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isFeedbackText, installFeedbackAnnouncer } from "./a11y-live.js";

describe("isFeedbackText", () => {
  it("matches answer feedback and ignores other text", () => {
    expect(isFeedbackText("✓ Riktig!")).toBe(true);
    expect(isFeedbackText("Nesten! ~")).toBe(true);
    expect(isFeedbackText("Feil svar")).toBe(true);
    expect(isFeedbackText("Velg et ord")).toBe(false);
    expect(isFeedbackText("Riktig " + "x".repeat(300))).toBe(false);
  });
});

describe("installFeedbackAnnouncer", () => {
  let root, stop;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="root"></div>';
    root = document.getElementById("root");
    stop = installFeedbackAnnouncer(root);
  });
  afterEach(() => { stop(); vi.useRealTimers(); });

  it("mirrors newly added feedback into the live region", async () => {
    const el = document.createElement("div");
    el.textContent = "✓ Riktig!";
    root.appendChild(el);
    await Promise.resolve(); // let MutationObserver flush
    vi.advanceTimersByTime(60);
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe("✓ Riktig!");
  });
});
