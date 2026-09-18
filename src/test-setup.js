// Node 25 ships an experimental global localStorage that shadows jsdom's and
// lacks clear()/key(). Install a plain in-memory Storage for tests.
class MemoryStorage {
  #m = new Map();
  get length() { return this.#m.size; }
  key(i) { return [...this.#m.keys()][i] ?? null; }
  getItem(k) { return this.#m.has(String(k)) ? this.#m.get(String(k)) : null; }
  setItem(k, v) { this.#m.set(String(k), String(v)); }
  removeItem(k) { this.#m.delete(String(k)); }
  clear() { this.#m.clear(); }
}
const storage = new MemoryStorage();
for (const target of [globalThis, globalThis.window].filter(Boolean)) {
  Object.defineProperty(target, "localStorage", { value: storage, configurable: true, writable: true });
}
