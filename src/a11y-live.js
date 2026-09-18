// Screen-reader support for answer feedback. Feedback panels ("✓ Riktig!",
// "Nesten! ~", "✗ Feil …") appear as plain DOM nodes with colour as the only
// cue, and they're spread over ~15 screens. Rather than touching each one, watch
// for them centrally and mirror their text into one polite live region.
const FEEDBACK = /^\s*(✓|✗|Riktig|Nesten|Feil|Ikke helt|Det var)/;
const MAX_LENGTH = 200; // skips large wrappers (whole screens) that merely start with a match

export function isFeedbackText(text) {
  return !!text && text.length <= MAX_LENGTH && FEEDBACK.test(text);
}

export function installFeedbackAnnouncer(root = document.getElementById("root")) {
  if (!root || typeof MutationObserver === "undefined") return () => {};
  const region = document.createElement("div");
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  document.body.appendChild(region);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const text = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (!isFeedbackText(text)) continue;
        region.textContent = "";
        setTimeout(() => { region.textContent = text; }, 50);
        return;
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => { observer.disconnect(); region.remove(); };
}
