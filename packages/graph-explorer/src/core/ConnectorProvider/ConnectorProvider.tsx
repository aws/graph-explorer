/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import LoggerConnector from "../../connector/LoggerConnector";
import useConfiguration from "../ConfigurationProvider/useConfiguration";
import type { ConnectorContextProps } from "./types";
import useOpenCypher from "../../connector/openCypher/useOpenCypher";
import useSPARQL from "../../connector/sparql/useSPARQL";
import useGremlin from "../../connector/gremlin/useGremlin";

export const ConnectorContext = createContext<ConnectorContextProps>({});

const ConnectorProvider = ({ children }: PropsWithChildren<any>) => {
  const config = useConfiguration();

  const [connector, setConnector] = useState<ConnectorContextProps>({
    explorer: undefined,
    logger: undefined,
  });
  const connecting = config && config.connection;

  const sparql = useSPARQL(connecting!);
  const openCypher = useOpenCypher(connecting!);
  const gremlin = useGremlin(connecting!);

  useEffect(() => {
    if (config?.connection?.url) {
      const queryEngine = config?.connection?.queryEngine;
      let explorer;
      const logger = new LoggerConnector(config?.connection?.url, {
        enable: import.meta.env.PROD,
      });

      switch (queryEngine) {
        case "sparql":
          explorer = sparql;
          break;
        case "openCypher":
          explorer = openCypher;
          break;
        default:
          explorer = gremlin;
          break;
      }

      setConnector({ explorer, logger });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We Only Want
  }, [config?.connection?.url, config?.connection?.queryEngine]);

  return (
    <ConnectorContext.Provider value={connector}>
      {children}
    </ConnectorContext.Provider>
  );
};

export default ConnectorProvider;
