import { type ConnectionConfig } from "@shared/types";
import { DEFAULT_SERVICE_TYPE } from "@/utils/constants";
import { anySignal } from "./utils/anySignal";
import { FeatureFlags } from "@/core";
import { z } from "zod";
import { logger, NetworkError } from "@/utils";

const NeptuneErrorSchema = z.object({
  code: z.string(),
  errno: z.string().optional(),
  requestId: z.string().optional(),
  detailedMessage: z.string().optional(),
  message: z.string().optional(),
  status: z.number().optional(),
  type: z.string().optional(),
});

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

  return { message: rawText };
}

// Construct the request headers based on the connection settings
function getAuthHeaders(
  connection: ConnectionConfig | undefined,
  featureFlags: FeatureFlags,
  typeHeaders: HeadersInit | undefined
) {
  const headers: HeadersInit = {};
  if (connection?.proxyConnection) {
    headers["graph-db-connection-url"] = connection.graphDbUrl || "";
    headers["db-query-logging-enabled"] = String(
      featureFlags.allowLoggingDbQuery
    );
  }
  if (connection?.awsAuthEnabled) {
    headers["aws-neptune-region"] = connection.awsRegion || "";
    headers["service-type"] = connection.serviceType || DEFAULT_SERVICE_TYPE;
  }

  return { ...headers, ...typeHeaders };
}

// Construct an AbortSignal for the fetch timeout if configured
function getFetchTimeoutSignal(connection: ConnectionConfig | undefined) {
  if (!connection?.fetchTimeoutMs) {
    return null;
  }

  if (connection.fetchTimeoutMs <= 0) {
    return null;
  }

  return AbortSignal.timeout(connection.fetchTimeoutMs);
}

export async function fetchDatabaseRequest(
  connection: ConnectionConfig | undefined,
  featureFlags: FeatureFlags,
  uri: URL | RequestInfo,
  options: RequestInit
) {
  // Apply connection settings to fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers: getAuthHeaders(connection, featureFlags, options.headers),
    signal: anySignal(getFetchTimeoutSignal(connection), options.signal),
  };

  const response = await fetch(uri, fetchOptions);

  if (!response.ok) {
    const defaultMessage = "Network response was not OK";
    const error = await decodeErrorSafely(response);

    // Log the error to the console always
    logger.error(`Response status ${response.status} received:`, error);

    // Parse out neptune specific error messages
    const parseNeptuneError = NeptuneErrorSchema.safeParse(error);
    if (parseNeptuneError.success) {
      const message =
        parseNeptuneError.data.detailedMessage ??
        parseNeptuneError.data.message ??
        defaultMessage;

      throw new NetworkError(message, response.status, parseNeptuneError.data);
    }
    // Or just throw a generic error
    throw new NetworkError(defaultMessage, response.status, error);
  }

  // A successful response is assumed to be JSON
  const data = await response.json();
  return data;
}
