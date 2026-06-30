import type { z } from "zod";

import localForage from "localforage";

import { persistThroughQueue } from "./persistence";
import { resolveSessionStorage } from "./safeSessionStorage";
import { createWriteThroughAtom } from "./writeThroughAtom";

/**
 * Converts a per-tab value to and from the string sessionStorage holds. The
 * shared localForage breadcrumb keeps the native value (structured clone, so a
 * `Set` survives), so only the per-tab layer needs this string round-trip.
 *
 * `serialize` returns `null` to mean "remove the per-tab key" — used when the
 * value is the kind of empty/cleared state that should not seed a later reload.
 * `deserialize` returns `null` when the stored string is missing or corrupt, so
 * seeding falls through to the breadcrumb rather than adopting a bad value.
 */
export type SessionValueCodec<T> = {
  serialize: (value: T) => string | null;
  deserialize: (raw: string | null) => T | null;
};

/**
 * Parses a sessionStorage JSON string against `schema`, returning `null` for a
 * missing, unparseable, or schema-invalid value so the caller treats it as a
 * miss. This keeps a stale or hand-edited per-tab value from seeding the atom
 * with the wrong shape.
 */
export function parseSessionJson<T>(
  raw: string | null,
  schema: z.ZodType<T>,
): T | null {
  if (raw === null || raw === "") {
    return null;
  }
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Creates an atom whose value is scoped to this browser tab.
 *
 * The value lives in sessionStorage so it survives a reload of this tab but
 * never leaks to other tabs. Each write also updates a shared, persisted
 * breadcrumb in localForage; that breadcrumb is read only once, here, to seed a
 * fresh tab on cold start.
 *
 * Seeding order: this tab's sessionStorage value (warm reload) wins; otherwise
 * the persisted breadcrumb (cold start) seeds it; otherwise `defaultValue`. A
 * cold-start seed is claimed into this tab's sessionStorage so the tab owns that
 * value: a later reload reads its own value back instead of re-seeding from a
 * breadcrumb another tab may have since moved.
 *
 * @param key Shared storage key, used for both the per-tab sessionStorage value
 * and the persisted localForage breadcrumb.
 * @param defaultValue Seed when neither the session value nor the breadcrumb is
 * present.
 * @param codec Converts the value to and from the string sessionStorage holds.
 * @param sessionStorage The per-tab storage backing. Injectable so multi-tab
 * isolation can be tested with separate storages.
 */
export async function createSessionScopedAtom<T>({
  key,
  defaultValue,
  codec,
  sessionStorage = resolveSessionStorage(),
}: {
  key: string;
  defaultValue: T;
  codec: SessionValueCodec<T>;
  sessionStorage?: Storage;
}) {
  let seedValue = codec.deserialize(sessionStorage.getItem(key));
  if (seedValue === null) {
    // Cold start: seed from the shared breadcrumb and claim it into this tab's
    // sessionStorage, so a later reload reads this value back rather than
    // re-seeding from a breadcrumb another tab may have since moved.
    seedValue = await localForage.getItem<T>(key);
    if (seedValue !== null) {
      writeSession(sessionStorage, key, codec.serialize(seedValue));
    }
  }

  return createWriteThroughAtom<T>(
    seedValue ?? defaultValue,
    // The per-tab sessionStorage value updates synchronously; the shared
    // localForage breadcrumb is persisted through the queue so its outcome
    // joins the global persistence status like any other IndexedDB write.
    nextValue => {
      writeSession(sessionStorage, key, codec.serialize(nextValue));
      persistThroughQueue(key, async () => {
        await localForage.setItem(key, nextValue);
      });
    },
    `createSessionScopedAtom(${key})`,
  );
}

/** Applies a serialized value to sessionStorage, removing the key for `null`. */
function writeSession(
  sessionStorage: Storage,
  key: string,
  serialized: string | null,
) {
  if (serialized === null) {
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.setItem(key, serialized);
  }
}
