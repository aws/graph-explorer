import { getAppStore } from "./StateProvider/appStore";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "./StateProvider/storageAtoms";
import {
  deriveProxyBaseUrl,
  readConnectionLink,
  resolveUrlConnectionIntent,
  type UrlConnectionIntent,
} from "./urlConnectionParams";

/**
 * Resolves a route's search string into an intent against the connections as
 * they are right now.
 *
 * A plain function rather than a hook, because opening a link is a one-shot
 * event: the caller resolves once on entry and acts on the result. It reads the
 * store directly, which keeps `urlConnectionParams` free of app state and the
 * DOM so its contract stays unit-testable in isolation.
 */
export function resolveConnectionLink(search: string): UrlConnectionIntent {
  const store = getAppStore();
  return resolveUrlConnectionIntent(
    readConnectionLink(search),
    store.get(configurationAtom),
    store.get(activeConfigurationAtom),
    deriveProxyBaseUrl(document.baseURI),
  );
}
