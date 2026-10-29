import { createStore } from "jotai";
import { describe, expect, it, vi } from "vite-plus/test";

import { createWriteThroughAtom } from "./writeThroughAtom";

function createHandle() {
  const persist = vi.fn();
  const handle = createWriteThroughAtom({
    key: "test-key",
    debugLabel: "test",
    load: () => Promise.resolve({ seed: "stored", persist }),
    seedDefault: () => ({ seed: "default", persist }),
  });
  return { handle, persist };
}

describe("createWriteThroughAtom", () => {
  it("throws when read before it loads", () => {
    const { handle } = createHandle();

    expect(() => createStore().get(handle.atom)).toThrow(
      'Persisted atom "test-key" was read before loadPersistedState() finished.',
    );
  });

  it("throws when written before it loads", () => {
    const { handle, persist } = createHandle();

    expect(() => createStore().set(handle.atom, "next")).toThrow(
      'Persisted atom "test-key" was read before loadPersistedState() finished.',
    );
    expect(persist).not.toHaveBeenCalled();
  });

  it("reads the loaded seed in any store", async () => {
    const { handle } = createHandle();

    await handle.load();

    expect(createStore().get(handle.atom)).toBe("stored");
    expect(createStore().get(handle.atom)).toBe("stored");
  });

  it("persists a changed value and skips an unchanged one", () => {
    const { handle, persist } = createHandle();
    handle.seedDefault();
    const store = createStore();

    store.set(handle.atom, "default");
    store.set(handle.atom, prev => `${prev}!`);

    expect(store.get(handle.atom)).toBe("default!");
    expect(persist).toHaveBeenCalledExactlyOnceWith("default!");
  });

  it("exposes its storage key", () => {
    expect(createHandle().handle.atom.storageKey).toBe("test-key");
  });
});
