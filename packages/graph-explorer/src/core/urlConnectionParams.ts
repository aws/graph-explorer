import type { QueryEngine, NeptuneServiceType } from "@shared/types";

import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

export interface UrlConnectionParams {
  graphDbUrl: string;
  queryEngine: QueryEngine;
  awsRegion: string;
  serviceType: string;
  name: string;
}

/** Parse URL search params into connection params. Returns null if graphDbUrl is missing. */
export function parseUrlConnectionParams(
  search: string,
): UrlConnectionParams | null {
  const params = new URLSearchParams(search);
  const graphDbUrl = params.get("graphDbUrl");
  if (!graphDbUrl) return null;

  return {
    graphDbUrl,
    queryEngine: (params.get("queryEngine") ?? "gremlin") as QueryEngine,
    awsRegion: params.get("awsRegion") ?? "",
    serviceType: params.get("serviceType") ?? "",
    name: params.get("name") ?? graphDbUrl,
  };
}

/** Find an existing connection matching graphDbUrl + queryEngine. */
export function findMatchingConnection(
  configurations: Map<ConfigurationId, RawConfiguration>,
  params: UrlConnectionParams,
): RawConfiguration | null {
  for (const config of configurations.values()) {
    if (
      config.connection?.graphDbUrl?.toLowerCase() ===
        params.graphDbUrl.toLowerCase() &&
      config.connection?.queryEngine === params.queryEngine
    ) {
      return config;
    }
  }
  return null;
}

/** Build a RawConfiguration from URL params. */
export function buildConnectionFromParams(
  params: UrlConnectionParams,
  origin: string,
): RawConfiguration {
  const id =
    `url-${params.graphDbUrl}-${params.queryEngine}` as ConfigurationId;
  return {
    id,
    displayLabel: params.name,
    connection: {
      url: origin,
      queryEngine: params.queryEngine,
      proxyConnection: true,
      graphDbUrl: params.graphDbUrl,
      awsAuthEnabled: !!(params.awsRegion && params.serviceType),
      awsRegion: params.awsRegion,
      serviceType: (params.serviceType || undefined) as
        | NeptuneServiceType
        | undefined,
    },
  };
}
