import {
  deriveProxyBaseUrl,
  readConnectionLink,
  resolveConnectionLinkIntent,
  type ConnectionLinkIntent,
} from "./connectionLink";
import { getAppStore } from "./StateProvider/appStore";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "./StateProvider/storageAtoms";

/**
 * Resolves a route's search string into an intent against the connections as
 * they are right now.
 *
 * A plain function rather than a hook, because opening a link is a one-shot
 * event: the caller resolves once on entry and acts on the result. It reads the
 * store directly, which keeps `connectionLink` free of app state and the
 * DOM so its contract stays unit-testable in isolation.
 */
export function resolveConnectionLink(search: string): ConnectionLinkIntent {
  const store = getAppStore();
  return resolveConnectionLinkIntent(
    readConnectionLink(search),
    store.get(configurationAtom),
    store.get(activeConfigurationAtom),
    deriveProxyBaseUrl(document.baseURI),
  );
}
