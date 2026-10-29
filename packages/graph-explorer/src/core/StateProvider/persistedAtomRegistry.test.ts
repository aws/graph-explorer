import { createStore } from "jotai";
import localforage from "localforage";
import { describe, expect, test } from "vite-plus/test";

import { atomWithLocalForage } from "./atomWithLocalForage";
import {
  loadPersistedAtom,
  loadPersistedAtoms,
  seedPersistedAtomsWithDefaults,
} from "./persistedAtomRegistry";

describe("loadPersistedAtoms", () => {
  test("loads every registered atom from storage", async () => {
    await localforage.setItem("registry-all-first", "stored first");
    await localforage.setItem("registry-all-second", "stored second");
    const first = atomWithLocalForage("registry-all-first", "default");
    const second = atomWithLocalForage("registry-all-second", "default");

    await loadPersistedAtoms();

    const store = createStore();
    expect(store.get(first)).toBe("stored first");
    expect(store.get(second)).toBe("stored second");
  });
});

describe("loadPersistedAtom", () => {
  test("loads only the given atom from storage", async () => {
    await localforage.setItem("registry-loaded", "stored");
    await localforage.setItem("registry-untouched", "stored");
    const loaded = atomWithLocalForage("registry-loaded", "default");
    const untouched = atomWithLocalForage("registry-untouched", "default");

    await loadPersistedAtom(loaded);

    const store = createStore();
    expect(store.get(loaded)).toBe("stored");
    expect(() => store.get(untouched)).toThrow(
      /read before loadPersistedState/,
    );
  });
});

describe("seedPersistedAtomsWithDefaults", () => {
  test("seeds registered atoms with their defaults, ignoring storage", async () => {
    await localforage.setItem("registry-seeded", "stored");
    const atom = await loadPersistedAtom(
      atomWithLocalForage("registry-seeded", "default"),
    );

    seedPersistedAtomsWithDefaults();

    expect(createStore().get(atom)).toBe("default");
  });
});
