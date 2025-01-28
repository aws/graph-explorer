import { every, isEqual } from "lodash";
import {
  ClientLoggerConnector,
  LoggerConnector,
  ServerLoggerConnector,
} from "@/connector/LoggerConnector";
import { createGremlinExplorer } from "@/connector/gremlin/gremlinExplorer";
import { createOpenCypherExplorer } from "@/connector/openCypher/openCypherExplorer";
import { createSparqlExplorer } from "@/connector/sparql/sparqlExplorer";
import { mergedConfigurationSelector } from "./StateProvider/configuration";
import { atom, selector, useRecoilValue } from "recoil";
import { equalSelector } from "@/utils/recoilState";
import { ConnectionConfig } from "@shared/types";
import { logger } from "@/utils";
import { featureFlagsSelector } from "./featureFlags";
import { Explorer } from "@/connector/useGEFetchTypes";

/**
 * Active connection where the value will only change when one of the
 * properties we care about are changed.
 */
export const activeConnectionSelector = equalSelector({
  key: "activeConnection",
  get: ({ get }) => {
    const config = get(mergedConfigurationSelector);
    return config?.connection;
  },
  equals: (latest, prior) => {
    if (Object.is(latest, prior)) {
      return true;
    }
    if (latest == null || prior == null) {
      return false;
    }
    const attrs = [
      "url",
      "queryEngine",
      "proxyConnection",
      "graphDbUrl",
      "awsAuthEnabled",
      "awsRegion",
      "fetchTimeoutMs",
      "nodeExpansionLimit",
    ] as (keyof ConnectionConfig)[];
    return every(attrs, attr => isEqual(latest[attr] as string, prior[attr]));
  },
});

/**
 * Explorer based on the active connection.
 */
export const explorerSelector = selector({
  key: "explorer",
  get: ({ get }) => {
    // Use this explorer override when testing
    const explorerForTesting = get(explorerForTestingAtom);
    if (explorerForTesting) {
      return explorerForTesting;
    }

    const connection = get(activeConnectionSelector);
    const featureFlags = get(featureFlagsSelector);

    if (!connection) {
      return null;
    }
    switch (connection.queryEngine) {
      case "openCypher":
        return createOpenCypherExplorer(connection, featureFlags);
      case "sparql":
        return createSparqlExplorer(connection, featureFlags, new Map());
      default:
        return createGremlinExplorer(connection, featureFlags);
    }
  },
});

export function useExplorer() {
  const explorer = useRecoilValue(explorerSelector);
  if (!explorer) {
    throw new Error("No explorer found");
  }
  return explorer;
}

/** CAUTION: This atom is only for testing purposes. */
export const explorerForTestingAtom = atom<Explorer | null>({
  key: "explorerForTesting",
  default: null,
});

export const queryEngineSelector = selector({
  key: "query-engine",
  get: ({ get }) => {
    const connection = get(activeConnectionSelector);
    return connection?.queryEngine ?? "gremlin";
  },
});

export function useQueryEngine() {
  return useRecoilValue(queryEngineSelector);
}

/**
 * Logger based on the active connection proxy URL.
 */
export const loggerSelector = selector<LoggerConnector>({
  key: "logger",
  get: ({ get }) => createLoggerFromConnection(get(activeConnectionSelector)),
});

/** Creates a logger instance that will be remote if the connection is using the
 * proxy server. Otherwise it will be a client only logger. */
export function createLoggerFromConnection(
  connection?: ConnectionConfig
): LoggerConnector {
  // Check for a url and that we are using the proxy server
  if (!connection || !connection.url || connection.proxyConnection !== true) {
    logger.debug(
      "Connection did not contain enough information to create a remote logger, so using a client logger instead",
      connection
    );
    return new ClientLoggerConnector();
  }

  logger.debug(
    "Creating a remote server logger using proxy server URL",
    connection.url
  );
  return new ServerLoggerConnector(connection.url);
}
