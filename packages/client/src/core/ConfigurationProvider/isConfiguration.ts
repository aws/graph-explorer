import type { ConfigurationContextProps } from "./types";

const logDevError = (...args: Parameters<typeof console.error>) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const isConfiguration = (config: any): config is ConfigurationContextProps => {
  if (!config) {
    return false;
  }

  if (!config?.graphExplorer) {
    return false;
  }

  if (Array.isArray(config.graphExplorer?.vertexTypes)) {
    for (const vertexType of config.graphExplorer.vertexTypes) {
      if (!vertexType.type) {
        logDevError("All vertices types should define 'type'");
        return false;
      }

      if (
        !vertexType.displayLabel ||
        !vertexType.attributes ||
        !Array.isArray(vertexType.attributes)
      ) {
        logDevError(
          `Invalid configuration for vertex type '${vertexType.type}'`
        );
        return false;
      }
    }
  }

  return true;
};

export default isConfiguration;
