import { saveAs } from "file-saver";

import { type ConfigurationContextProps, normalizeUrl } from "@/core";

import type { ExportedConnectionFile } from "./parseConnectionFile";

import { toJsonFileData } from "./fileData";

const saveConfigurationToFile = (config: ConfigurationContextProps) => {
  const { graphDbUrl, ...connection } = config.connection ?? {};
  const normalizedGraphDbUrl = normalizeUrl(graphDbUrl);
  const exportableConfig: ExportedConnectionFile = {
    id: config.id,
    displayLabel: config.displayLabel || config.id,
    connection: {
      ...connection,
      url: normalizeUrl(config.connection?.url),
      queryEngine: config.connection?.queryEngine || "gremlin",
      // Omit an empty graphDbUrl entirely; a present "" fails import validation.
      // Normalized non-proxy configs carry "", so guard on the cleaned value.
      ...(normalizedGraphDbUrl && { graphDbUrl: normalizedGraphDbUrl }),
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
