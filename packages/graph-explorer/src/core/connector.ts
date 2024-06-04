import { every, isEqual } from "lodash";
import LoggerConnector from "../connector/LoggerConnector";
import { createGremlinExplorer } from "../connector/gremlin/gremlinExplorer";
import { createOpenCypherExplorer } from "../connector/openCypher/openCypherExplorer";
import { createSparqlExplorer } from "../connector/sparql/sparqlExplorer";
import { mergedConfigurationSelector } from "./StateProvider/configuration";
import { selector } from "recoil";
import { equalSelector } from "../utils/recoilState";
import { env } from "../utils";

/**
 * Active connection where the value will only change when one of the
 * properties we care about are changed.
 */
const activeConnectionSelector = equalSelector({
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
    ] as const;
    return every(attrs, attr => isEqual(latest[attr] as string, prior[attr]));
  },
});

/**
 * Active connection URL
 */
const activeConnectionUrlSelector = equalSelector({
  key: "activeConnectionUrl",
  get: ({ get }) => {
    const connection = get(activeConnectionSelector);
    return connection?.url;
  },
  equals: (latest, prior) => latest === prior,
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
export const loggerSelector = selector({
  key: "logger",
  get: ({ get }) => {
    const url = get(activeConnectionUrlSelector);
    if (!url) {
      return null;
    }

    return new LoggerConnector(url, {
      enable: env.PROD,
    });
  },
});
