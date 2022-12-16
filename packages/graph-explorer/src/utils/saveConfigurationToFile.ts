import { saveAs } from "file-saver";
import { ConfigurationContextProps } from "../core";

const saveConfigurationToFile = (config: ConfigurationContextProps) => {
  const exportableConfig = {
    id: config.id,
    displayLabel: config.displayLabel || config.id,
    connection: {
      ...(config.connection || {}),
      queryEngine: config.connection?.queryEngine || "gremlin",
    },
    schema: {
      vertices: config.schema?.vertices || [],
      edges: config.schema?.edges || [],
      prefixes: config?.schema?.prefixes?.map(prefix => ({
        ...prefix,
        __matches: Array.from(prefix.__matches || []),
      })),
      lastUpdate: config.schema?.lastUpdate?.toISOString(),
    },
  };

  const fileToSave = new Blob([JSON.stringify(exportableConfig)], {
    type: "application/json",
  });

  saveAs(fileToSave, `${exportableConfig.displayLabel}.json`);
};

export default saveConfigurationToFile;
