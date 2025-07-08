import { logger } from "@/utils";
import { GMapWithValue } from "../types";

export function parseGMap<Key, Value>(
  gMap: GMapWithValue<Key, Value>
): Map<Key, Value> {
  const map = new Map<Key, Value>();
  for (let i = 0; i < gMap["@value"].length; i += 2) {
    const key = gMap["@value"][i] as Key;
    const value = gMap["@value"][i + 1] as Value;

    if (!key || !value) {
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
