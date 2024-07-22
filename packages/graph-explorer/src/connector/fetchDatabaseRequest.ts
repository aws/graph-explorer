import { type ConnectionConfig } from "../core";
import { DEFAULT_SERVICE_TYPE } from "../utils/constants";
import { anySignal } from "./utils/anySignal";

type NeptuneError = {
  code: string;
  requestId: string;
  detailedMessage: string;
  message?: string;
};

function isNeptuneError(value: unknown): value is NeptuneError {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  if (!("code" in value) || typeof value.code !== "string") {
    return false;
  }

  if (
    !("detailedMessage" in value) ||
    typeof value.detailedMessage !== "string"
  ) {
    return false;
  }

  if (!("requestId" in value) || typeof value.requestId !== "string") {
    return false;
  }

  return true;
}

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

  if (isJson) {
    try {
      const data = await response.json();

      // Flatten the error if it contains an error object
      return data?.error ?? data;
    } catch (error) {
      console.error("Failed to decode the error response as JSON", {
        error,
        response,
      });
      return undefined;
    }
  }

  try {
    const message = await response.text();
    return { message };
  } catch (error) {
    console.error("Failed to decode the error response as text", {
      error,
      response,
    });
  }

  return undefined;
}

// Construct the request headers based on the connection settings
function getAuthHeaders(
  connection: ConnectionConfig | undefined,
  typeHeaders: HeadersInit | undefined
) {
  const headers: HeadersInit = {};
  if (connection?.proxyConnection) {
    headers["graph-db-connection-url"] = connection.graphDbUrl || "";
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
  uri: URL | RequestInfo,
  options: RequestInit
) {
  // Apply connection settings to fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers: getAuthHeaders(connection, options.headers),
    signal: anySignal(getFetchTimeoutSignal(connection), options.signal),
  };

  const response = await fetch(uri, fetchOptions);

  if (!response.ok) {
    const error = await decodeErrorSafely(response);
    if (isNeptuneError(error)) {
      throw new Error(error.detailedMessage, { cause: error });
    }
    throw new Error("Network response was not OK", { cause: error });
  }

  // A successful response is assumed to be JSON
  const data = await response.json();
  return data;
}
