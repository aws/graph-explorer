import { createContext, PropsWithChildren, useState } from "react";
import GremlinConnector from "../../connector/gremlin/GremlinConnector";
import LoggerConnector from "../../connector/LoggerConnector";
import SPARQLConnector from "../../connector/sparql/SPARQLConnector";
import { ConnectionConfig } from "../ConfigurationProvider";
import useConfiguration from "../ConfigurationProvider/useConfiguration";
import type { ConnectorContextProps } from "./types";

export const ConnectorContext = createContext<ConnectorContextProps>({});

const ConnectorProvider = ({ children }: PropsWithChildren<any>) => {
  const config = useConfiguration();
  const [connector, setConnector] = useState<ConnectorContextProps>({
    explorer: undefined,
    logger: undefined,
  });

  const [prevConnection, setPrevConnection] = useState<
    ConnectionConfig | undefined
  >();

  // connector instance is only rebuilt if any connection attribute change
  if (!isSameConnection(prevConnection, config?.connection)) {
    const isSPARQL =
      config?.connection?.queryEngine &&
      config?.connection?.queryEngine === "sparql";

    if (!config?.connection?.url) {
      setConnector({
        explorer: undefined,
        logger: undefined,
      });
    } else if (isSPARQL) {
      setConnector({
        explorer: new SPARQLConnector(config.connection),
        logger: new LoggerConnector(config.connection.url, {
          enable: import.meta.env.PROD,
        }),
      });
    } else {
      setConnector({
        explorer: new GremlinConnector(config.connection),
        logger: new LoggerConnector(config.connection.url, {
          enable: import.meta.env.PROD,
        }),
      });
    }

    setPrevConnection(config?.connection);
  }

  return (
    <ConnectorContext.Provider value={connector}>
      {children}
    </ConnectorContext.Provider>
  );
};

export default ConnectorProvider;

// Deep check without isEqual to avoid
// nested comparison of non-relevant properties
const attrs = [
  "url",
  "queryEngine",
  "proxyConnection",
  "graphDbUrl",
  "awsAuthEnabled",
  "awsRegion",
  "enableCache",
  "cacheTimeMs",
] as const;

const isSameConnection = (a?: ConnectionConfig, b?: ConnectionConfig) => {
  for (const attr of attrs) {
    if (a?.[attr] !== b?.[attr]) {
      return false;
    }
  }

  return true;
};
