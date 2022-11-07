import { createContext, PropsWithChildren, useEffect, useState } from "react";
import type { AbstractConnector } from "../../connector/AbstractConnector";
import GremlinConnector from "../../connector/gremlin/GremlinConnector";
import SparQLConnector from "../../connector/sparQL/SparQLConnector";
import useConfiguration from "../ConfigurationProvider/useConfiguration";
import type { ConnectorContextProps } from "./types";

export const ConnectorContext = createContext<ConnectorContextProps>({});

const ConnectorProvider = ({ children }: PropsWithChildren<any>) => {
  const config = useConfiguration();
  const [connector, setConnector] = useState<AbstractConnector>();

  useEffect(() => {
    const isSparQL =
      config?.connection?.queryEngine &&
      config?.connection?.queryEngine === "sparql";

    if (!config?.connection?.url) {
      setConnector(undefined);
      return;
    }

    if (isSparQL) {
      setConnector(new SparQLConnector(config));
      return;
    }

    setConnector(new GremlinConnector(config));
  }, [config]);

  return (
    <ConnectorContext.Provider value={{ explorer: connector }}>
      {children}
    </ConnectorContext.Provider>
  );
};

export default ConnectorProvider;
