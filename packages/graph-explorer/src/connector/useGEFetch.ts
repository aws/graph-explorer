import { useCallback } from 'react';
import localforage from "localforage";
import { CacheItem } from './useGEFetchTypes';
import type { ConnectionConfig } from '../core';

// 10 minutes
const CACHE_TIME_MS = 10 * 60 * 1000;

const localforageCache = localforage.createInstance({
  name: "ge",
  version: 1.0,
  storeName: "connector-cache",
});

const useGEFetch = (connection: ConnectionConfig) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { url, enableCache, proxyConnection, awsAuthEnabled, awsRegion, graphDbUrl } = connection!;

  if (!url) {
    throw new Error("Invalid configuration. Missing 'connection.url'");
  }

  const _getFromCache = useCallback(async (key) => {
    if (!enableCache) {
      return;
    }

    return localforageCache.getItem(key) as Promise<CacheItem | undefined>;
  }, [enableCache]);

  const _setToCache = useCallback(async (key, value) => {
    if (enableCache) {
      return;
    }

    return localforageCache.setItem(key, value);
  }, [enableCache]);

  const _requestAndCache = useCallback(async (url, options) => {
    const response = await fetch(url, options);
    const data = await response.json();
    if (options?.disableCache !== true) {
      _setToCache(url, { data, updatedAt: new Date().getTime() });
    }
    return data as any;
  }, [_setToCache]);

  const getAuthHeaders = useCallback(() => {
    const headers: HeadersInit = {};
    if (proxyConnection) {
      headers["graph-db-connection-url"] = graphDbUrl || "";
    }
    if (awsAuthEnabled) {
      delete headers["host"];
      headers["aws-neptune-region"] = awsRegion || "";
    }

    return headers;

  }, [awsAuthEnabled, awsRegion, graphDbUrl, proxyConnection]);


  const request = useCallback(async (uri, options) => {
    const cachedResponse = await _getFromCache(uri);
    if (
      cachedResponse &&
      cachedResponse.updatedAt +
      (connection.cacheTimeMs ?? CACHE_TIME_MS) >
      new Date().getTime()
    ) {
      return cachedResponse.data;
    }

    const fetchOptions: RequestInit = {
      headers: getAuthHeaders(),
    };

    const connectionFetchTimeout = connection.fetchTimeoutMs;

    if (connectionFetchTimeout && connectionFetchTimeout > 0) {
      fetchOptions.signal = AbortSignal.timeout(
        connectionFetchTimeout,
      );
    }

    return _requestAndCache(uri, { ...fetchOptions, ...options }) as Promise<any>;
  }, [_getFromCache, _requestAndCache, connection.cacheTimeMs, connection.fetchTimeoutMs, getAuthHeaders]);  // dependency on connection assuming it affects this function

  return {
    request,
  };
};

export default useGEFetch;
