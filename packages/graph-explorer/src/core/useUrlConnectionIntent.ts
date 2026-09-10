import { useAtomValue } from "jotai";
import { useLocation } from "react-router";

import { activeConfigurationAtom, configurationAtom } from "./StateProvider";
import {
  deriveProxyBaseUrl,
  readConnectionLink,
  resolveUrlConnectionIntent,
  type UrlConnectionIntent,
} from "./urlConnectionParams";

/**
 * Resolves the current route's connection link into an intent against the live
 * connection state. Reads the router location so the params are taken from after
 * the `#` (Graph Explorer uses a hash router); `window.location.search` would be
 * empty here. Drive it from a router context (a real route or a `MemoryRouter`
 * in tests).
 */
export function useUrlConnectionIntent(): UrlConnectionIntent {
  const location = useLocation();
  const configuration = useAtomValue(configurationAtom);
  const activeId = useAtomValue(activeConfigurationAtom);

  return resolveUrlConnectionIntent(
    readConnectionLink(location.search),
    configuration,
    activeId,
    deriveProxyBaseUrl(document.baseURI),
  );
}
