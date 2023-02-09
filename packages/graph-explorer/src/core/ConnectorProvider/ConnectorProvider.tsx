import { createContext, PropsWithChildren, useState } from "react";
import type { AbstractConnector } from "../../connector/AbstractConnector";
import GremlinConnector from "../../connector/gremlin/GremlinConnector";
import SPARQLConnector from "../../connector/sparql/SPARQLConnector";
import { ConnectionConfig } from "../ConfigurationProvider";
import useConfiguration from "../ConfigurationProvider/useConfiguration";
import type { ConnectorContextProps } from "./types";

export const ConnectorContext = createContext<ConnectorContextProps>({});

const ConnectorProvider = ({ children }: PropsWithChildren<any>) => {
  const config = useConfiguration();
  const [connector, setConnector] = useState<AbstractConnector>();

  const [prevConnection, setPrevConnection] = useState<
    ConnectionConfig | undefined
  >();

  // connector instance is only rebuilt if any connection attribute change
  if (!isSameConnection(prevConnection, config?.connection)) {
    const isSPARQL =
      config?.connection?.queryEngine &&
      config?.connection?.queryEngine === "sparql";

    if (!config?.connection?.url) {
      setConnector(undefined);
    } else if (isSPARQL) {
      setConnector(new SPARQLConnector(config?.connection));
    } else {
      setConnector(new GremlinConnector(config?.connection));
    }

    setPrevConnection(config?.connection);
  }

  return (
    <ConnectorContext.Provider value={{ explorer: connector }}>
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
