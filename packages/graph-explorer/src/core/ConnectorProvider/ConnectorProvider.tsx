/* eslint-disable react-hooks/rules-of-hooks */
import { createContext, PropsWithChildren, useState } from "react";
import LoggerConnector from "../../connector/LoggerConnector";
import useConfiguration from "../ConfigurationProvider/useConfiguration";
import type { ConnectorContextProps } from "./types";
import useOpenCypher from "../../connector/openCypher/useOpenCypher";
import useSPARQL from "../../connector/sparql/useSPARQL";
import useGremlin from "../../connector/gremlin/useGremlin";
import { ConnectionConfig } from "../ConfigurationProvider/types";

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
  // Deep check without isEqual to avoid
  // nested comparison of non-relevant properties
  const attrs = [
    "url",
    "queryEngine",
    "graphDbUrl",
    "awsAuthEnabled",
    "awsRegion",
    "enableCache",
  ] as const;

  const isSameConnection = (a?: ConnectionConfig, b?: ConnectionConfig) => {
    for (const attr of attrs) {
      if (a?.[attr] !== b?.[attr]) {
        return false;
      }
    }

    return true;
  };

  // connector instance is only rebuilt if any connection attribute change
  if (!isSameConnection(prevConnection, config?.connection)) {
    const isSPARQL =
      config?.connection?.queryEngine &&
      config?.connection?.queryEngine === "sparql";

    const isOpenCypher =
      config?.connection?.queryEngine &&
      config?.connection?.queryEngine === "openCypher";

    if (!config?.connection?.url) {
      setConnector({
        explorer: undefined,
        logger: undefined,
      });
      setPrevConnection(undefined);
    } else if (isSPARQL) {
      setConnector({
        explorer: useSPARQL(config.connection),
        logger: new LoggerConnector(config.connection.url, {
          enable: import.meta.env.PROD,
        }),
      });
      setPrevConnection(config.connection);
    } else if (isOpenCypher) {
      setConnector({
        explorer: useOpenCypher(config?.connection),
        logger: new LoggerConnector(config.connection.url, {
          enable: import.meta.env.PROD,
        }),
      });
      setPrevConnection(config.connection);
    } else {
      setConnector({
        explorer: useGremlin(config.connection),
        logger: new LoggerConnector(config.connection.url, {
          enable: import.meta.env.PROD,
        }),
      });
      setPrevConnection(config.connection);
    }
  }

  return (
    <ConnectorContext.Provider value={connector}>
      {children}
    </ConnectorContext.Provider>
  );
};

export default ConnectorProvider;
