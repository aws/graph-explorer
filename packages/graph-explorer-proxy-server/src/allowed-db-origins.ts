import { HttpError } from "./errors.ts";

export function assertAllowedDbOrigin(
  url: string,
  allowedOrigins: Set<string> | undefined,
) {
  if (!allowedOrigins) {
    return;
  }
  const origin = new URL(url).origin;
  if (!allowedOrigins.has(origin)) {
    throw new HttpError(
      403,
      `Database origin "${origin}" is not in the Database Origin Allowlist (PROXY_SERVER_ALLOWED_DB_ORIGINS). Contact your administrator.`,
    );
  }
}
