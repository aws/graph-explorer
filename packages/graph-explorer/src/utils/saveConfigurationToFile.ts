import { saveAs } from "file-saver";

import type { ConfigurationContextProps } from "@/core";

import type { ExportedConnectionFile } from "./parseConnectionFile";

import { toJsonFileData } from "./fileData";

const saveConfigurationToFile = (config: ConfigurationContextProps) => {
  const exportableConfig: ExportedConnectionFile = {
    id: config.id,
    displayLabel: config.displayLabel || config.id,
    connection: {
      ...config.connection,
      url: config.connection?.url ?? "",
      queryEngine: config.connection?.queryEngine || "gremlin",
    },
    schema: {
      vertices: config.schema.vertices,
      edges: config.schema.edges,
      prefixes: config.schema.prefixes,
      lastUpdate: config.schema.lastUpdate,
      edgeConnections: config.schema.edgeConnections,
    },
  };

  const fileToSave = toJsonFileData(exportableConfig);
  saveAs(fileToSave, `${exportableConfig.displayLabel}.connection.json`);
};

export default saveConfigurationToFile;
