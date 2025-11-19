import { logger } from "@/utils";
import type { GMapWithValue } from "../types";

/**
 * Parses a gremlin map type in to a JavaScript Map object.
 *
 * Gremlin g:Map values are an array where the key and value are in the array as
 * pairs, so you must parse two items at a time.
 *
 * If either the key or the value does not exist it will be skipped.
 *
 * i.e. [key, value, key, value, key, value]
 *
 * NOTE: The map key and value are not parsed. This is simply pairing up the
 * values and casting them to the right type before adding them to the JS Map
 * object.
 */
export function parseGMap<Key, Value>(
  gMap: GMapWithValue<Key, Value>,
): Map<Key, Value> {
  const map = new Map<Key, Value>();
  for (let i = 0; i < gMap["@value"].length; i += 2) {
    const key = gMap["@value"][i] as Key;
    const value = gMap["@value"][i + 1] as Value;

    if (key == null || value == null) {
      logger.warn("Did not find a matching pair of values in the g:Map", {
        key,
        value,
      });
      continue;
    }

    map.set(key, value);
  }
  return map;
}
