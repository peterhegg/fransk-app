// The Worker truncates each message at 4000 chars, cutting the END of a prompt.
// Known-word lists grow without bound, so cap them (keeping the most recently
// added words) or the output-format spec that follows would be cut off.
export function capKnownWords(knownWords, maxChars = 1500) {
  const all = [...knownWords];
  const kept = [];
  let len = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    len += all[i].length + 2;
    if (len > maxChars) break;
    kept.push(all[i]);
  }
  return kept.reverse().join(", ");
}
