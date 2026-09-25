import type { FeatureFlags, NormalizedConnection } from "@/core";

import {
  databaseTimeoutCode,
  DatabaseTimeoutError,
  FetchTimeoutError,
  logger,
  NetworkError,
  ServerConnectionError,
} from "@/utils";
import { DEFAULT_SERVICE_TYPE } from "@/utils/constants";
import { extractErrorMessage } from "@/utils/extractErrorMessage";

import { anySignal } from "./utils/anySignal";

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

// Construct the request headers based on the connection settings
function getAuthHeaders(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  typeHeaders: HeadersInit | undefined,
) {
  const headers: Record<string, string> = {};
  if (connection.proxyConnection) {
    headers["graph-db-connection-url"] = connection.graphDbUrl || "";
    headers["db-query-logging-enabled"] = String(
      featureFlags.allowLoggingDbQuery,
    );
  }
  if (connection.awsAuthEnabled) {
    headers["aws-neptune-region"] = connection.awsRegion || "";
    headers["service-type"] = connection.serviceType || DEFAULT_SERVICE_TYPE;
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
async function sendRequest(uri: URL | RequestInfo, fetchOptions: RequestInit) {
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

export async function fetchDatabaseRequest(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  uri: URL | RequestInfo,
  options: RequestInit,
) {
  const fetchTimeout = createFetchTimeout(connection);
  const signal = anySignal(fetchTimeout?.signal, options.signal);

  // Apply connection settings to fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers: getAuthHeaders(connection, featureFlags, options.headers),
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
      const url =
        typeof uri === "string" ? uri : uri instanceof URL ? uri.href : uri.url;
      throw new ServerConnectionError(url, error);
    }
    throw error;
  }
}
