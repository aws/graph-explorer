import { useCallback } from "react";
import { useConfiguration, type ConnectionConfig } from "../core";
import { DEFAULT_SERVICE_TYPE } from "../utils/constants";
import { anySignal } from "./utils/anySignal";

/**
 * Attempts to decode the error response into a JSON object.
 *
 * @param response The fetch response that should be decoded
 * @returns The decoded response or undefined if it fails to decode
 */
async function decodeErrorSafely(response: Response): Promise<any | undefined> {
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

const useGEFetch = () => {
  const connection = useConfiguration()?.connection as
    | ConnectionConfig
    | undefined;

  // Construct the request headers based on the connection settings
  const getAuthHeaders = useCallback(
    (typeHeaders: HeadersInit | undefined) => {
      const headers: HeadersInit = {};
      if (connection?.proxyConnection) {
        headers["graph-db-connection-url"] = connection.graphDbUrl || "";
      }
      if (connection?.awsAuthEnabled) {
        headers["aws-neptune-region"] = connection.awsRegion || "";
        headers["service-type"] =
          connection.serviceType || DEFAULT_SERVICE_TYPE;
      }

      return { ...headers, ...typeHeaders };
    },
    [
      connection?.awsAuthEnabled,
      connection?.awsRegion,
      connection?.graphDbUrl,
      connection?.proxyConnection,
      connection?.serviceType,
    ]
  );

  // Construct an AbortSignal for the fetch timeout if configured
  const getFetchTimeoutSignal = useCallback(() => {
    if (!connection?.fetchTimeoutMs) {
      return null;
    }

    if (connection.fetchTimeoutMs <= 0) {
      return null;
    }

    return AbortSignal.timeout(connection.fetchTimeoutMs);
  }, [connection?.fetchTimeoutMs]);

  const request = useCallback(
    async (uri: URL | RequestInfo, options: RequestInit) => {
      // Apply connection settings to fetch options
      const fetchOptions: RequestInit = {
        ...options,
        headers: getAuthHeaders(options.headers),
        signal: anySignal(getFetchTimeoutSignal(), options.signal),
      };

      const response = await fetch(uri, fetchOptions);

      if (!response.ok) {
        const error = await decodeErrorSafely(response);
        throw new Error("Network response was not OK", { cause: error });
      }

      // A successful response is assumed to be JSON
      const data = await response.json();
      return data;
    },
    [getAuthHeaders, getFetchTimeoutSignal]
  );

  return {
    request,
  };
};

export default useGEFetch;
