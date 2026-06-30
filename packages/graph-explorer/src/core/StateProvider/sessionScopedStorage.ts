import type { z } from "zod";

import localForage from "localforage";

import { logger } from "@/utils";

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
 * Parses a sessionStorage JSON string against `schema`. Returns `null` only for
 * an absent value (`null` or empty string) — a legitimate miss. A present but
 * unparseable or schema-invalid value is corrupt and **throws** (`SyntaxError`
 * from `JSON.parse` or `ZodError` from the schema); the seam that owns seeding
 * (`createSessionScopedAtom`) catches it, so detecting corruption stays separate
 * from deciding what to do about it.
 */
export function parseSessionJson<T>(
  raw: string | null,
  schema: z.ZodType<T>,
): T | null {
  if (raw === null || raw === "") {
    return null;
  }
  return schema.parse(JSON.parse(raw));
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
  let seedValue = readSessionSeed(sessionStorage, key, codec);
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

/**
 * Reads and decodes this tab's per-tab seed, recovering from a corrupt value.
 *
 * `codec.deserialize` throws on a present-but-invalid value (and reading
 * sessionStorage itself can throw a `SecurityError` when DOM storage is
 * blocked). Either is a recoverable miss: a stale or hand-edited per-tab value
 * should not crash app startup, so it is logged and treated as absent, letting
 * the caller fall through to the shared breadcrumb then the default.
 */
function readSessionSeed<T>(
  sessionStorage: Storage,
  key: string,
  codec: SessionValueCodec<T>,
): T | null {
  try {
    return codec.deserialize(sessionStorage.getItem(key));
  } catch (error) {
    logger.warn(
      `Discarding corrupt per-tab value for "${key}"; falling back to the persisted breadcrumb.`,
      error,
    );
    return null;
  }
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
