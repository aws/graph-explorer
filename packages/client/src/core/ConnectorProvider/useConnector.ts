import { useContext } from "react";
import { ConnectorContext } from "./ConnectorProvider";

const useConnector = () => {
  const context = useContext(ConnectorContext);

  if (import.meta.env.DEV && !context) {
    throw new Error("Cannot useConnector outside ConnectorProvider");
  }

  return context;
};

export default useConnector;
