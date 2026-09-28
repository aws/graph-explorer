import type { FeatureFlags, NormalizedConnection } from "@/core";

import { isDirectConnection } from "@/core/StateProvider/configuration";
import {
  databaseTimeoutCode,
  DatabaseTimeoutError,
  DatabaseUnreachableError,
  FetchTimeoutError,
  InsecureDatabaseUrlError,
  InvalidDatabaseUrlError,
  isAbsoluteHttpUrl,
  isMixedContent,
  logger,
  MissingDatabaseUrlError,
  NetworkError,
  ServerConnectionError,
} from "@/utils";
import { DEFAULT_SERVICE_TYPE } from "@/utils/constants";
import { extractErrorMessage } from "@/utils/extractErrorMessage";

import type { ExplorerRequestOptions } from "./useGEFetchTypes";

import { anySignal } from "./utils/anySignal";
import { apiUrl } from "./utils/apiUrl";

/**
 * Attempts to decode the error response into a JSON object.
 *
 * @param response The fetch response that should be decoded
 * @returns The decoded response or undefined if it fails to decode
 */
async function decodeErrorSafely(response: Response): Promise<any> {
  const contentType = response.headers.get("Content-Type");
  const contentTypeHasValue = contentType !== null && contentType.length > 0;
  // Assume missing content type is JSON
  const isJson =
    !contentTypeHasValue || contentType.includes("application/json");

  // Extract the raw text from the response
  const rawText = await response.text();

  // Check for empty response
  if (!rawText) {
    return undefined;
  }

  if (isJson) {
    try {
      // Try parsing the response as JSON
      const data = JSON.parse(rawText);

      // Flatten the error if it contains an error object
      return data?.error ?? data;
    } catch (error) {
      console.error("Failed to decode the error response as JSON", {
        error,
        rawText,
      });
      return rawText;
    }
  }

  return rawText;
}

// The Graph Explorer server's route for a proxy connection, or the database
// itself for a deprecated direct connection.
function resolveEndpoint(connection: NormalizedConnection, path: string): URL {
  if (!isDirectConnection(connection)) {
    return apiUrl(path);
  }
  if (!isAbsoluteHttpUrl(connection.graphDbUrl)) {
    throw new InvalidDatabaseUrlError(connection.graphDbUrl);
  }
  return new URL(`${connection.graphDbUrl}/${path}`);
}

// The browser's TypeError doesn't say why the request failed, so an http URL
// from an https page is taken to mean the browser blocked it as mixed content.
function unreachableError(
  connection: NormalizedConnection,
  uri: URL,
  cause: TypeError,
): Error {
  if (!isDirectConnection(connection)) {
    return new ServerConnectionError(uri.href, cause);
  }
  return isMixedContent(uri)
    ? new InsecureDatabaseUrlError(uri.href, cause)
    : new DatabaseUnreachableError(uri.href, cause);
}

// Construct the request headers based on the connection settings
function getAuthHeaders(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  typeHeaders: HeadersInit | undefined,
  queryId: string | undefined,
) {
  const headers: Record<string, string> = {};
  // The database never reads these, and custom headers on a cross-origin
  // request would trigger a CORS preflight it may reject.
  if (!isDirectConnection(connection)) {
    headers["graph-db-connection-url"] = connection.graphDbUrl;
    headers["db-query-logging-enabled"] = String(
      featureFlags.allowLoggingDbQuery,
    );
    if (connection.awsAuthEnabled) {
      headers["aws-neptune-region"] = connection.awsRegion || "";
      headers["service-type"] = connection.serviceType || DEFAULT_SERVICE_TYPE;
    }
    if (queryId) {
      headers.queryId = queryId;
    }
  }

  if (typeHeaders) {
    Object.assign(headers, Object.fromEntries(new Headers(typeHeaders)));
  }

  return headers;
}

type FetchTimeout = {
  timeoutMs: number;
  signal: AbortSignal;
};

// Construct the fetch timeout, if configured, keeping both its signal and
// its duration so a caught abort can be classified and reported.
function createFetchTimeout(
  connection: NormalizedConnection,
): FetchTimeout | null {
  const timeoutMs = connection.fetchTimeoutMs;
  if (!timeoutMs || timeoutMs <= 0) {
    return null;
  }

  return { timeoutMs, signal: AbortSignal.timeout(timeoutMs) };
}

// Sends the request and reads the response body, throwing NetworkError (or
// DatabaseTimeoutError) for a non-OK response. Kept separate from
// fetchDatabaseRequest so a timeout that fires while streaming the body,
// not just while waiting on `fetch`, is still classified by the caller.
async function sendRequest(uri: URL, fetchOptions: RequestInit) {
  const response = await fetch(uri, fetchOptions);

  if (!response.ok) {
    const defaultMessage = "Network response was not OK";
    const error = await decodeErrorSafely(response);

    // Log the error to the console always
    logger.error(`Response status ${response.status} received:`, error);

    // Extract a message from the error body
    const message = extractErrorMessage(error) ?? defaultMessage;
    const timeoutCode = databaseTimeoutCode(error);
    throw timeoutCode
      ? new DatabaseTimeoutError(message, response.status, error, timeoutCode)
      : new NetworkError(message, response.status, error);
  }

  // A successful response is assumed to be JSON
  return await response.json();
}

/**
 * Sends a request to the database endpoint `path` (e.g. `gremlin` or
 * `pg/statistics/summary?mode=basic`) for the connection, routed through the
 * Graph Explorer server unless the connection is direct.
 */
export async function fetchDatabaseRequest(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  path: string,
  options: ExplorerRequestOptions,
) {
  if (!connection.graphDbUrl) {
    throw new MissingDatabaseUrlError();
  }

  const uri = resolveEndpoint(connection, path);
  const { queryId, ...init } = options;
  const fetchTimeout = createFetchTimeout(connection);
  const signal = anySignal(fetchTimeout?.signal, init.signal);

  // Apply connection settings to fetch options
  const fetchOptions: RequestInit = {
    ...init,
    headers: getAuthHeaders(connection, featureFlags, init.headers, queryId),
    signal,
  };

  try {
    return await sendRequest(uri, fetchOptions);
  } catch (error) {
    // anySignal keeps the first reason, so this tells a timeout from a user
    // cancel that came after it. An error built from a received response
    // already says what happened, so it is never relabeled.
    if (
      fetchTimeout &&
      !(error instanceof NetworkError) &&
      signal?.reason === fetchTimeout.signal.reason
    ) {
      throw new FetchTimeoutError(fetchTimeout.timeoutMs, error);
    }

    if (error instanceof TypeError) {
      throw unreachableError(connection, uri, error);
    }
    throw error;
  }
}
