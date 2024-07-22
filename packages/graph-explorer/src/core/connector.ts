import { every, isEqual } from "lodash";
import {
  ClientLoggerConnector,
  LoggerConnector,
  ServerLoggerConnector,
} from "../connector/LoggerConnector";
import { createGremlinExplorer } from "../connector/gremlin/gremlinExplorer";
import { createOpenCypherExplorer } from "../connector/openCypher/openCypherExplorer";
import { createSparqlExplorer } from "../connector/sparql/sparqlExplorer";
import { mergedConfigurationSelector } from "./StateProvider/configuration";
import { selector } from "recoil";
import { equalSelector } from "../utils/recoilState";
import { ConnectionConfig } from "./ConfigurationProvider";

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
    const connection = get(activeConnectionSelector);

    if (!connection) {
      return null;
    }
    switch (connection.queryEngine) {
      case "openCypher":
        return createOpenCypherExplorer(connection);
      case "sparql":
        return createSparqlExplorer(connection, new Map());
      default:
        return createGremlinExplorer(connection);
    }
  },
});

/**
 * Logger based on the active connection proxy URL.
 */
export const loggerSelector = selector<LoggerConnector>({
  key: "logger",
  get: ({ get }) => {
    const connection = get(activeConnectionSelector);

    // Check for a url and that we are using the proxy server
    if (!connection || !connection.url || connection.proxyConnection === true) {
      return new ClientLoggerConnector();
    }

    return new ServerLoggerConnector(connection.url);
  },
});
