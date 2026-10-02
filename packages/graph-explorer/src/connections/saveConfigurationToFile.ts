import type { ConnectionConfig } from "@shared/types";

import { saveAs } from "file-saver";

import type { ConfigurationContextProps } from "@/core/ConfigurationProvider";

import { apiUrl } from "@/connector/utils/apiUrl";
import { toJsonFileData } from "@/utils/fileData";

import type { ExportedConnectionFile } from "./parseConnectionFile";

import { isDirectConnection, normalizeUrl } from "./normalizeConnection";

const saveConfigurationToFile = (config: ConfigurationContextProps) => {
  const { graphDbUrl, ...connection } = config.connection ?? {};
  const normalizedGraphDbUrl = normalizeUrl(graphDbUrl);
  const exportableConfig: ExportedConnectionFile = {
    id: config.id,
    displayLabel: config.displayLabel || config.id,
    connection: {
      ...connection,
      queryEngine: config.connection?.queryEngine || "gremlin",
      // A config with no URL must omit the key entirely; a present "" fails the z.url() check on import.
      ...(normalizedGraphDbUrl && { graphDbUrl: normalizedGraphDbUrl }),
      ...legacyConnectionFields(config.connection, normalizedGraphDbUrl),
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

/**
 * The fields versions before the unified-proxy model need to import the file:
 * `url` and an explicit `proxyConnection`. See ADR
 * `unify-docker-image-remove-sagemaker-variant`.
 */
function legacyConnectionFields(
  connection: ConnectionConfig | undefined,
  normalizedGraphDbUrl: string,
) {
  const isDirect = isDirectConnection(connection);
  return {
    proxyConnection: !isDirect,
    // Omitted with `graphDbUrl`, so a URL-less file still fails import.
    ...(normalizedGraphDbUrl && {
      url: isDirect ? normalizedGraphDbUrl : normalizeUrl(apiUrl("").href),
    }),
  };
}

export default saveConfigurationToFile;
