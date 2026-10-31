import { blockedLiteralError, isBlockedHost } from "./blocked-addresses.ts";
import { HttpError } from "./errors.ts";

/**
 * Throws {@link HttpError} 403 unless the proxy may forward to the URL's
 * origin. An IP literal in the refused set of reserved cloud service and
 * IPv6 link-local addresses is always refused, and the Database Origin
 * Allowlist applies on top when one is configured. Host names are checked when
 * they resolve, by the database request agent, unless an environment proxy
 * resolves them.
 */
export function assertPermittedDbOrigin(
  url: string,
  allowedOrigins: Set<string> | undefined,
) {
  const parsed = new URL(url);
  const origin = parsed.origin;
  if (isBlockedHost(parsed.hostname)) {
    throw blockedLiteralError(origin);
  }
  if (allowedOrigins && !allowedOrigins.has(origin)) {
    throw new HttpError(
      403,
      `Database origin "${origin}" is not in the Database Origin Allowlist (PROXY_SERVER_ALLOWED_DB_ORIGINS). Contact your administrator.`,
    );
  }
}
