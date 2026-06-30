import { z } from "zod";

import { LABELS } from "@/utils/constants";

const fileEnvelopeMetaSchema = z.object({
  kind: z.string(),
  // Written as an integer; older files on disk carry the legacy `"1.0"` string,
  // so both forms are accepted and normalized by `parseVersion`.
  version: z.union([z.string(), z.number()]),
  timestamp: z.string(),
  source: z.string(),
  sourceVersion: z.string(),
});

const fileEnvelopeSchema = z.object({
  meta: fileEnvelopeMetaSchema,
  data: z.unknown(),
});

export type FileEnvelopeMeta = z.infer<typeof fileEnvelopeMetaSchema>;

export type FileEnvelope<T = unknown> = {
  meta: FileEnvelopeMeta;
  data: T;
};

/**
 * A validated envelope. `version` is the normalized integer generation (the
 * field on disk may be a legacy decimal string); consumers switch on it to
 * pick their per-generation payload parser.
 */
export type ParsedEnvelope = {
  meta: FileEnvelopeMeta;
  version: number;
  data: unknown;
};

export class FileEnvelopeError extends Error {
  readonly issues: z.core.$ZodIssue[] | undefined;

  constructor(message: string, issues?: z.core.$ZodIssue[]) {
    super(message);
    this.name = "FileEnvelopeError";
    this.issues = issues;
  }
}

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
 * invalid JSON, a malformed envelope, the wrong `kind`, an unparseable version,
 * or a version newer than this build. The payload (`data`) is returned
 * unvalidated for the caller to parse per kind.
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

  const version = parseVersion(meta.version);
  if (version === null) {
    throw new FileEnvelopeError(
      `File has an unrecognized version "${meta.version}"`,
    );
  }
  if (version > expectation.supportedVersion) {
    throw new FileEnvelopeError(
      `This file was created by a newer version of ${LABELS.APP_NAME} and cannot be imported. Update ${LABELS.APP_NAME} and try again.`,
    );
  }

  return { meta, version, data: result.data.data };
}

/**
 * Reads the format generation as a positive integer. Generations start at `1`,
 * so anything below it is unrecognized. Tolerates the legacy `"1.0"`
 * decimal-string form (parsed as `1`) that early exports wrote to disk.
 */
function parseVersion(version: string | number): number | null {
  const parsed =
    typeof version === "number" ? version : Number.parseInt(version, 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}
