import { useEffect, useSyncExternalStore } from "react";

import { iconRegistry, type ResolvedIcon } from "./iconRegistry";
import { type IconSource, type IconSourceId, iconSourceId } from "./iconSource";

/**
 * Resolved icons for the given sources, re-rendering as each one lands. Holds
 * one subscription however many sources are passed — that is the point.
 */
export function useResolvedIcons(
  sources: IconSource[],
): ReadonlyMap<IconSourceId, ResolvedIcon> {
  const icons = useSyncExternalStore(
    iconRegistry.subscribe,
    iconRegistry.getSnapshot,
  );

  useEffect(() => {
    iconRegistry.request(sources);
  }, [sources]);

  return icons;
}

/** The resolved form of a single icon, or `undefined` until it lands. */
export function useResolvedIcon(source: IconSource): ResolvedIcon | undefined {
  const icons = useSyncExternalStore(
    iconRegistry.subscribe,
    iconRegistry.getSnapshot,
  );
  const id = iconSourceId(source);

  useEffect(() => {
    iconRegistry.request([source]);
  }, [source]);

  return id === null ? undefined : icons.get(id);
}
