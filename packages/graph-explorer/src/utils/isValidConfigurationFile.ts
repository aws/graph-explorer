import type { ConnectionConfig } from "@shared/types";

import { queryEngineOptions } from "@shared/types";
import { z } from "zod";

import type { ConfigurationId, SchemaStorageModel } from "@/core";

/**
 * The schema as it appears on disk inside an exported connection file. It
 * mirrors {@link SchemaStorageModel} except `lastUpdate` is an ISO string rather
 * than a `Date`, since JSON has no date type. Import revives it into a `Date`.
 */
export type ExportedConnectionSchema = Omit<
  SchemaStorageModel,
  "lastUpdate"
> & {
  lastUpdate?: string;
};

/**
 * The top-level envelope of an exported connection file, as produced by
 * `saveConfigurationToFile` and consumed on import. The connection lands in
 * `configurationAtom` and the schema is split out into `schemaAtom`.
 *
 * This is the real wire format. It is intentionally separate from the in-memory
 * configuration types so that the on-disk shape can evolve independently.
 */
export type ExportedConnectionFile = {
  id: ConfigurationId;
  displayLabel?: string;
  connection: ConnectionConfig;
  schema: ExportedConnectionSchema;
};

const isValidHttpUrl = (str: string) => {
  let url;
  try {
    url = new URL(str);
  } catch {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

/**
 * Validation gate for an imported file. It checks only the fields the import
 * flow depends on and ignores everything else, so unknown or legacy fields
 * (e.g. styling, `__matches` on prefixes) pass through untouched — the import
 * hook reads the original parsed object, not this schema's output.
 *
 * This is deliberately separate from {@link ExportedConnectionFile}: the type
 * is the rich structural contract the writer and importer share, while this
 * schema is the lenient runtime check.
 */
const exportedConnectionFileSchema = z.object({
  id: z.string().min(1),
  connection: z.object({
    url: z.string().refine(isValidHttpUrl),
    queryEngine: z.enum(queryEngineOptions),
  }),
  schema: z.object({
    vertices: z.array(
      z.object({
        type: z.string().min(1),
        attributes: z.array(z.object({ name: z.string().min(1) })),
      }),
    ),
    edges: z.array(z.object({ type: z.string().min(1) })),
  }),
});

const isValidConfigurationFile = (
  data: unknown,
): data is ExportedConnectionFile =>
  exportedConnectionFileSchema.safeParse(data).success;

export default isValidConfigurationFile;
