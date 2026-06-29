import { z } from "zod";

import { LABELS } from "@/utils/constants";

const fileEnvelopeMetaSchema = z.looseObject({
  kind: z.string(),
  version: z.string(),
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

export type ParsedEnvelope = z.infer<typeof fileEnvelopeSchema>;

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
  version: string,
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

  return result.data;
}

/**
 * Reads the format generation as a single integer. Tolerates the legacy
 * `"1.0"` string form (parsed as `1`) that early exports wrote to disk.
 */
function parseVersion(version: string): number | null {
  const parsed = Number.parseInt(version, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
