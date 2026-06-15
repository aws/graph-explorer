import { queryEngineOptions } from "@shared/types";
import { z } from "zod";

import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { type ConfigurationId, createEdgeType, createVertexType } from "@/core";

function isValidHttpUrl(value: string) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * The wire format of an exported connection file, as produced by
 * `saveConfigurationToFile` and consumed on import.
 *
 * This Zod schema is the single source of truth for the format: the
 * {@link ExportedConnectionFile} type is inferred from it, so the runtime check
 * and the static type can never drift apart.
 *
 * Every object is a `looseObject`, so unknown and legacy fields (styling on
 * vertex/edge configs, `__inferred`/`__matches` on prefixes, optional
 * connection fields, attribute `dataType`, …) pass through untouched into the
 * parsed output. Only the fields the import flow depends on are validated, and
 * branded ids and the `lastUpdate` `Date` are produced here so callers consume
 * a ready-to-store value rather than re-deriving it.
 *
 * It is intentionally decoupled from the in-memory configuration types and the
 * IndexedDB storage shape so the on-disk format can evolve independently.
 */
const attributesSchema = z
  .array(z.looseObject({ name: z.string().min(1) }))
  .optional()
  .default([]);

const exportedConnectionFileSchema = z.looseObject({
  id: z.string().min(1).transform(toConfigurationId),
  displayLabel: z.string().optional(),
  connection: z.looseObject({
    url: z.string().refine(isValidHttpUrl),
    queryEngine: z.enum(queryEngineOptions),
  }),
  schema: z.looseObject({
    vertices: z.array(
      z.looseObject({
        type: z.string().min(1).transform(createVertexType),
        attributes: attributesSchema,
      }),
    ),
    edges: z.array(
      z.looseObject({
        type: z.string().min(1).transform(createEdgeType),
        attributes: attributesSchema,
      }),
    ),
    prefixes: z
      .array(
        z.looseObject({
          prefix: z.string().min(1).transform(toRdfPrefix),
          uri: z.string().min(1).transform(toIriNamespace),
        }),
      )
      .optional(),
    edgeConnections: z
      .array(
        z.looseObject({
          edgeType: z.string().min(1).transform(createEdgeType),
          sourceVertexType: z.string().min(1).transform(createVertexType),
          targetVertexType: z.string().min(1).transform(createVertexType),
        }),
      )
      .optional(),
    lastUpdate: z.coerce.date().optional(),
  }),
});

/**
 * The parsed, ready-to-store shape of an exported connection file. Inferred
 * from {@link exportedConnectionFileSchema}; branded ids and a real `Date`
 * `lastUpdate` are already applied.
 */
export type ExportedConnectionFile = z.infer<
  typeof exportedConnectionFileSchema
>;

/**
 * The on-disk shape of an exported connection file, before parsing. This is the
 * type the writer (`saveConfigurationToFile`) targets: ids are plain strings
 * and `lastUpdate` is the ISO string that lands in JSON.
 */
export type ExportedConnectionFileInput = z.input<
  typeof exportedConnectionFileSchema
>;

/**
 * Parses an unknown value (a JSON-decoded file) into an
 * {@link ExportedConnectionFile}, or returns `null` if it does not match the
 * wire format. Unknown and legacy keys are preserved on the returned object.
 */
export function parseConnectionFile(
  data: unknown,
): ExportedConnectionFile | null {
  const result = exportedConnectionFileSchema.safeParse(data);
  return result.success ? result.data : null;
}

function toConfigurationId(value: string) {
  return value as ConfigurationId;
}

function toRdfPrefix(value: string) {
  return value as RdfPrefix;
}

function toIriNamespace(value: string) {
  return value as IriNamespace;
}
