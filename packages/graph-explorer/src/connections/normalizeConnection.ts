import type { ConnectionConfig, QueryEngine } from "@shared/types";

import { z } from "zod";

import { positiveWholeNumberSchema } from "@/core/positiveWholeNumber";

/**
 * A stored numeric connection override: a positive integer, or absent when
 * the stored value is missing or is not one. Accepts the digit string an
 * older version may have written.
 */
export const storedNumericOverrideSchema = z
  .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
  .pipe(positiveWholeNumberSchema)
  .optional()
  .catch(undefined);

/**
 * Cleans a URL for storage and request use: strips newlines and surrounding
 * whitespace (pasted from docs/chat), then the trailing slash. Tolerates a
 * missing value because a stored connection can lack `graphDbUrl` despite the
 * compile-time required type.
 */
export function normalizeUrl(url: string | undefined): string {
  return (
    url
      ?.replace(/[\r\n]/g, "")
      .trim()
      .replace(/\/$/, "") ?? ""
  );
}

/** Whether the browser sends requests to the database itself. */
export function isDirectConnection(
  connection: ConnectionConfig | undefined,
): boolean {
  return connection?.proxyConnection === false;
}

/**
 * Reads a stored connection with the app's defaults applied. A numeric
 * override that is not a positive integer reads as absent, and IAM is on only
 * when stored as exactly `true`.
 */
export function normalizeConnection(
  connection: ConnectionConfig,
): NormalizedConnection {
  const {
    fetchTimeoutMs: storedFetchTimeoutMs,
    nodeExpansionLimit: storedNodeExpansionLimit,
    ...rest
  } = connection;
  const fetchTimeoutMs =
    storedNumericOverrideSchema.parse(storedFetchTimeoutMs);
  const nodeExpansionLimit = storedNumericOverrideSchema.parse(
    storedNodeExpansionLimit,
  );
  return {
    ...rest,
    graphDbUrl: normalizeUrl(connection.graphDbUrl),
    queryEngine: connection.queryEngine || "gremlin",
    awsAuthEnabled: connection.awsAuthEnabled === true,
    ...(fetchTimeoutMs && { fetchTimeoutMs }),
    ...(nodeExpansionLimit && { nodeExpansionLimit }),
  };
}

export type NormalizedConnection = ConnectionConfig & {
  queryEngine: QueryEngine;
  awsAuthEnabled: boolean;
};
