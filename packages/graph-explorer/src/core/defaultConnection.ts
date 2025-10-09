import { logger, DEFAULT_SERVICE_TYPE } from "@/utils";
import { queryEngineOptions, neptuneServiceTypeOptions } from "@shared/types";
import { z } from "zod";
import {
  type ConfigurationId,
  type RawConfiguration,
} from "./ConfigurationProvider";

export const DefaultConnectionDataSchema = z.object({
  // Connection info
  GRAPH_EXP_USING_PROXY_SERVER: z.boolean().default(false),
  GRAPH_EXP_CONNECTION_URL: z.string().url().catch(""),
  GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT: z.string().url().catch(""),
  GRAPH_EXP_GRAPH_TYPE: z.enum(queryEngineOptions).optional(),
  // IAM auth info
  GRAPH_EXP_IAM: z.boolean().default(false),
  GRAPH_EXP_AWS_REGION: z.string().optional().default(""),
  GRAPH_EXP_SERVICE_TYPE: z
    .enum(neptuneServiceTypeOptions)
    .default(DEFAULT_SERVICE_TYPE)
    .catch(DEFAULT_SERVICE_TYPE),
  // Connection options
  GRAPH_EXP_FETCH_REQUEST_TIMEOUT: z.number().default(240000),
  GRAPH_EXP_NODE_EXPANSION_LIMIT: z.number().optional(),
});

export type DefaultConnectionData = z.infer<typeof DefaultConnectionDataSchema>;

/** Fetches the default connections from multiple possible locations and returns an empty array on failure. */
export async function fetchDefaultConnection() {
  const defaultConnectionPath = `${location.origin}/defaultConnection`;
  const sagemakerConnectionPath = `${location.origin}/proxy/9250/defaultConnection`;

  try {
    const defaultConnection =
      (await fetchDefaultConnectionFor(defaultConnectionPath)) ??
      (await fetchDefaultConnectionFor(sagemakerConnectionPath));

    if (!defaultConnection) {
      return [];
    }

    const config = mapToConnection(defaultConnection);

    // A specific query engine was specified, so just return that
    if (config.connection?.queryEngine) {
      return [config];
    }

    // No query engine was specified, so return all the possible ones
    const configs = queryEngineOptions.map(queryEngine => {
      return <RawConfiguration>{
        ...config,
        id: `${config.id}-${queryEngine}` as ConfigurationId,
        connection: {
          ...config.connection,
          queryEngine: queryEngine,
        },
      };
    });

    return configs;
  } catch (error) {
    logger.error(
      `Error when trying to create connection: ${error instanceof Error ? error.message : "Unexpected error"}`
    );
    return [];
  }
}

/** Attempts to fetch a default connection from the given URL and returns null on a failure. */
export async function fetchDefaultConnectionFor(
  url: string
): Promise<DefaultConnectionData | null> {
  try {
    logger.debug("Fetching default connection from", url);
    const response = await fetch(url);
    if (!response.ok) {
      const responseText = await response.text();
      logger.warn(
        `Response status ${response.status} for default connection url`,
        url,
        responseText
      );
      return null;
    }
    const data = await response.json();
    logger.debug("Default connection data for url", url, data);
    const result = DefaultConnectionDataSchema.safeParse(data);
    if (result.success) {
      return result.data;
    } else {
      logger.warn(
        "Failed to parse default connection data",
        result.error.flatten()
      );
      return null;
    }
  } catch (error) {
    logger.warn("Failed to fetch default connection for path", url, error);
    return null;
  }
}

export function mapToConnection(data: DefaultConnectionData): RawConfiguration {
  const config: RawConfiguration = {
    id: "Default Connection" as ConfigurationId,
    displayLabel: "Default Connection",
    connection: {
      url: data.GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT,
      queryEngine: data.GRAPH_EXP_GRAPH_TYPE,
      proxyConnection: data.GRAPH_EXP_USING_PROXY_SERVER,
      graphDbUrl: data.GRAPH_EXP_CONNECTION_URL,
      awsAuthEnabled: data.GRAPH_EXP_IAM,
      awsRegion: data.GRAPH_EXP_AWS_REGION,
      serviceType: data.GRAPH_EXP_SERVICE_TYPE,
      fetchTimeoutMs: data.GRAPH_EXP_FETCH_REQUEST_TIMEOUT,
      nodeExpansionLimit: data.GRAPH_EXP_NODE_EXPANSION_LIMIT,
    },
  };
  return config;
}
