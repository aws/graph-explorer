import { useContext } from "react";
import { ConfigurationContext } from "./ConfigurationProvider";

const useConfiguration = () => {
  return useContext(ConfigurationContext);
};

export default useConfiguration;
