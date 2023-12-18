/* eslint-disable react-hooks/rules-of-hooks */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import LoggerConnector from "../../connector/LoggerConnector";
import useConfiguration from "../ConfigurationProvider/useConfiguration";
import type { ConnectorContextProps } from "./types";
import useOpenCypher from "../../connector/openCypher/useOpenCypher";
import useSPARQL from "../../connector/sparql/useSPARQL";
import useGremlin from "../../connector/gremlin/useGremlin";
import { ConnectionConfig } from "../ConfigurationProvider/types";
import { useRecoilValue } from "recoil";
import { mergedConfigurationSelector } from "../StateProvider/configuration";
import { every, isEqual } from "lodash";

export const ConnectorContext = createContext<ConnectorContextProps>({});

const ConnectorProvider = ({ children }: PropsWithChildren<any>) => {
  const config = useRecoilValue(mergedConfigurationSelector);

  const [connector, setConnector] = useState<ConnectorContextProps>({
    explorer: undefined,
    logger: undefined,
  });
  const openCypherExplorer = useOpenCypher();
  const sparqlExplorer = useSPARQL(new Map());
  const gremlinExplorer = useGremlin();

  const [prevConnection, setPrevConnection] = useState<
    ConnectionConfig | undefined
  >();

  const attrs = useMemo(
    () =>
      [
        "url",
        "queryEngine",
        "proxyConnection",
        "graphDbUrl",
        "awsAuthEnabled",
        "awsRegion",
        "enableCache",
        "cacheTimeMs",
        "fetchTimeoutMs",
      ] as const,
    []
  );

  const isSameConnection = useCallback(
    (a?: ConnectionConfig, b?: ConnectionConfig) =>
      every(attrs, attr => isEqual(a?.[attr] as string, b?.[attr])),
    [attrs]
  );

  const getExplorer = useCallback(
    (connection: ConnectionConfig) => {
      switch (connection.queryEngine) {
        case "openCypher":
          return openCypherExplorer;
        case "sparql":
          return sparqlExplorer;
        default:
          return gremlinExplorer;
      }
    },
    [openCypherExplorer, sparqlExplorer, gremlinExplorer]
  );

  useEffect(() => {
    // connector instance is only rebuilt if any connection attribute change
    if (!isSameConnection(prevConnection, config?.connection)) {
      setConnector({
        explorer: getExplorer(
          (config?.connection as ConnectionConfig) || undefined
        ),
        logger: new LoggerConnector(config?.connection?.url ?? "", {
          enable: import.meta.env.PROD,
        }),
      });
      setPrevConnection(config?.connection);
    }
  }, [
    config?.connection?.url,
    config?.connection?.queryEngine,
    prevConnection,
    config?.connection,
    isSameConnection,
    getExplorer,
  ]);

  return (
    <ConnectorContext.Provider value={connector}>
      {children}
    </ConnectorContext.Provider>
  );
};

export default ConnectorProvider;
