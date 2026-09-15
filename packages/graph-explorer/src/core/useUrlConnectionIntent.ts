import { useAtomValue } from "jotai";
import { useLocation } from "react-router";

import { activeConfigurationAtom, configurationAtom } from "./StateProvider";
import {
  deriveProxyBaseUrl,
  hasConnectionLinkParams,
  parseUrlConnectionParams,
  resolveUrlConnectionIntent,
  type UrlConnectionIntent,
} from "./urlConnectionParams";

/**
 * Resolves the current route's connection params into an intent against the
 * live connection state. Reads the router location so the params are taken from
 * after the `#` (Graph Explorer uses a hash router); `window.location.search`
 * would be empty here. Drive it from a router context (a real route or a
 * `MemoryRouter` in tests).
 */
export function useUrlConnectionIntent(): UrlConnectionIntent {
  const location = useLocation();
  const configuration = useAtomValue(configurationAtom);
  const activeId = useAtomValue(activeConfigurationAtom);

  const params = parseUrlConnectionParams(location.search);
  if (!params) {
    // A link carrying a graphDbUrl that failed validation is a malformed link,
    // not the absence of one — surface it so the user knows their link was bad.
    return hasConnectionLinkParams(location.search)
      ? { kind: "invalid" }
      : { kind: "none" };
  }

  return resolveUrlConnectionIntent(
    params,
    configuration,
    activeId,
    deriveProxyBaseUrl(document.baseURI),
  );
}
