import { z } from "zod";

import { LABELS } from "@/utils/constants";

/**
 * The one non-integer version any shipped build ever wrote to disk. New files
 * write the integer form; this string is normalized to `1` on read.
 */
const LEGACY_VERSION_STRING = "1.0";

/**
 * Version as it appears in a file: either the integer generation or the legacy
 * `"1.0"` string. Normalized to the integer generation. Lives in the parse
 * schema so a malformed version fails structural parsing, not a later guard.
 */
const versionSchema = z
  .union([z.literal(LEGACY_VERSION_STRING), z.int().min(1)])
  .transform(version => (version === LEGACY_VERSION_STRING ? 1 : version));

/**
 * The full metadata every export writes. `timestamp`/`source`/`sourceVersion`
 * are diagnostic only — they are part of the write contract but nothing reads
 * them back, so the read schema below does not require them.
 */
export type FileEnvelopeMeta = {
  kind: string;
  version: number;
  timestamp: string;
  source: string;
  sourceVersion: string;
};

export type FileEnvelope<T = unknown> = {
  meta: FileEnvelopeMeta;
  data: T;
};

/**
 * The read contract: only the fields the reader acts on. `kind` selects the
 * expected file type and `version` selects the payload generation; the
 * diagnostic fields are ignored (and stripped) rather than validated, so a file
 * that omits or malforms them still imports. A malformed `version` fails here,
 * at structural parse time.
 */
const parsedMetaSchema = z.object({
  kind: z.string(),
  version: versionSchema,
});

const fileEnvelopeSchema = z.object({
  meta: parsedMetaSchema,
  data: z.unknown(),
});

/**
 * A validated envelope. `meta.version` is the normalized integer generation
 * (the field on disk may be the legacy `"1.0"` string); consumers switch on it
 * to pick their per-generation payload parser.
 */
export type ParsedEnvelope = z.infer<typeof fileEnvelopeSchema>;

export class FileEnvelopeError extends Error {
  readonly issues: z.core.$ZodIssue[] | undefined;

  constructor(message: string, issues?: z.core.$ZodIssue[]) {
    super(message);
    this.name = "FileEnvelopeError";
    this.issues = issues;
  }
}

/**
 * Filename convention for saved Graph Explorer documents: `<name>.<type>.json`,
 * e.g. `graph-explorer.styles.json`, `graph-explorer.config.json`,
 * `<connection>.connection.json`, `<connection>.<timestamp>.graph.json`. The
 * `.<type>.` segment makes files self-describing so a human can tell them apart
 * in an OS file dialog — where every kind otherwise shows as a generic `.json`.
 *
 * It is a naming convention only: loads validate by content (the envelope
 * `kind` here, or a backup's structure), never by filename, so a renamed file
 * still loads and files saved before this convention are unaffected.
 */
export function createFileEnvelope<T>(
  kind: string,
  version: number,
  data: T,
): FileEnvelope<T> {
  return {
    meta: {
      kind,
      version,
      timestamp: new Date().toISOString(),
      source: LABELS.APP_NAME,
      sourceVersion: __GRAPH_EXP_VERSION__,
    },
    data,
  };
}

export type EnvelopeExpectation = {
  /** The `kind` discriminator this caller knows how to read. */
  kind: string;
  /**
   * The newest format generation this build understands. The version is a
   * single integer that bumps only on a breaking change — additive changes are
   * made as optional fields and do not bump it. A file from the same or an
   * older generation imports; a newer one is rejected as too new.
   */
  supportedVersion: number;
};

/**
 * Reads and validates the outer envelope, then guards `kind` and `version`
 * against what the caller supports. Throws {@link FileEnvelopeError} for
 * invalid JSON, a malformed envelope (including an unrecognized version), the
 * wrong `kind`, or a version newer than this build. The payload (`data`) is
 * returned unvalidated for the caller to parse per kind.
 */
export async function parseFileEnvelope(
  blob: Blob,
  expectation: EnvelopeExpectation,
): Promise<ParsedEnvelope> {
  let json: unknown;
  try {
    const text = await blob.text();
    json = JSON.parse(text);
  } catch {
    throw new FileEnvelopeError("File is not valid JSON");
  }

  const result = fileEnvelopeSchema.safeParse(json);
  if (!result.success) {
    throw new FileEnvelopeError(
      "File does not have the expected envelope structure",
      result.error.issues,
    );
  }

  const { meta } = result.data;

  if (meta.kind !== expectation.kind) {
    throw new FileEnvelopeError(
      `Expected a "${expectation.kind}" file, but got "${meta.kind}"`,
    );
  }

  if (meta.version > expectation.supportedVersion) {
    throw new FileEnvelopeError(
      `This file was created by a newer version of ${LABELS.APP_NAME} and cannot be imported. Update ${LABELS.APP_NAME} and try again.`,
    );
  }

  return result.data;
}
