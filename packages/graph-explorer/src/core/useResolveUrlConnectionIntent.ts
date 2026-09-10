import { useStore } from "jotai";
import { useCallback } from "react";

import { activeConfigurationAtom, configurationAtom } from "./StateProvider";
import {
  deriveProxyBaseUrl,
  readConnectionLink,
  resolveUrlConnectionIntent,
  type UrlConnectionIntent,
} from "./urlConnectionParams";

/**
 * Returns a callback that resolves a route's search string into an intent
 * against the connections as they are when it runs.
 *
 * A callback rather than a hook returning the intent, because opening a link is
 * a one-shot event: the caller resolves once on entry and acts on the result.
 * Re-deriving the intent every render would re-decide an already-decided
 * question, and would keep changing the identity of a value read only once.
 *
 * Reads through the store rather than `useAtomValue` so the caller can resolve
 * wherever it needs to — including a `useState` initializer — without
 * subscribing to connection changes it does not care about.
 */
export function useResolveUrlConnectionIntent() {
  const store = useStore();
  return useCallback(
    (search: string): UrlConnectionIntent =>
      resolveUrlConnectionIntent(
        readConnectionLink(search),
        store.get(configurationAtom),
        store.get(activeConfigurationAtom),
        deriveProxyBaseUrl(document.baseURI),
      ),
    [store],
  );
}
