import { saveAs } from "file-saver";

import { apiUrl } from "@/connector/utils/apiUrl";
import { type ConfigurationContextProps, normalizeUrl } from "@/core";
import { isDirectConnection } from "@/core/StateProvider/configuration";

import type { ExportedConnectionFile } from "./parseConnectionFile";

import { toJsonFileData } from "./fileData";

const saveConfigurationToFile = (config: ConfigurationContextProps) => {
  const { graphDbUrl, ...connection } = config.connection ?? {};
  const normalizedGraphDbUrl = normalizeUrl(graphDbUrl);
  const isDirect = isDirectConnection(config.connection);
  const exportableConfig: ExportedConnectionFile = {
    id: config.id,
    displayLabel: config.displayLabel || config.id,
    connection: {
      ...connection,
      // Older versions read a missing `proxyConnection` as direct.
      proxyConnection: !isDirect,
      queryEngine: config.connection?.queryEngine || "gremlin",
      // A config with no URL must omit the keys entirely; a present "" fails the z.url() check on import.
      ...(normalizedGraphDbUrl && {
        graphDbUrl: normalizedGraphDbUrl,
        // Older versions require `url`: the proxy server for a proxy
        // connection, or the database for a direct one.
        url: isDirect ? normalizedGraphDbUrl : normalizeUrl(apiUrl("").href),
      }),
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
