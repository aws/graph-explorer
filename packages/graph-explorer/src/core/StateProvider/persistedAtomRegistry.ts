import type { PersistedAtom, PersistedAtomHandle } from "./writeThroughAtom";

type PersistedAtomLoader = {
  load: () => Promise<void>;
  seedDefault: () => void;
};

const loaders = new Map<object, PersistedAtomLoader>();

/**
 * Registers a persisted atom so {@link loadPersistedAtoms} seeds it, and returns
 * the atom. Registering is what makes an app-wide atom part of startup.
 */
export function registerPersistedAtom<T>(
  handle: PersistedAtomHandle<T>,
): PersistedAtom<T> {
  loaders.set(handle.atom, handle);
  return handle.atom;
}

/** Loads every registered atom from storage, in parallel. */
export async function loadPersistedAtoms(): Promise<void> {
  await Promise.all(Array.from(loaders.values(), loader => loader.load()));
}

/**
 * Loads one registered atom from storage and returns it. For tests that need
 * an atom loaded on its own, such as a tab opening after another tab wrote.
 */
export async function loadPersistedAtom<T>(
  atom: PersistedAtom<T>,
): Promise<PersistedAtom<T>> {
  const loader = loaders.get(atom);
  if (!loader) {
    throw new Error(`Persisted atom "${atom.storageKey}" is not registered.`);
  }
  await loader.load();
  return atom;
}

/** Seeds every registered atom with its default, without I/O. For tests. */
export function seedPersistedAtomsWithDefaults(): void {
  for (const loader of loaders.values()) {
    loader.seedDefault();
  }
}
