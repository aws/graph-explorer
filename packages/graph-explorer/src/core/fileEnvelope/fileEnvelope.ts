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
   * The highest payload-schema major version this build understands. A file
   * with the same major imports (the salvaging payload parser ignores unknown
   * minor-version additions); a higher major is rejected as too new.
   */
  supportedMajorVersion: number;
};

/**
 * Reads and validates the outer envelope, then guards `kind` and major
 * `version` against what the caller supports. Throws {@link FileEnvelopeError}
 * for invalid JSON, a malformed envelope, the wrong `kind`, an unparseable
 * version, or a major version newer than this build. The payload (`data`) is
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

  const majorVersion = parseMajorVersion(meta.version);
  if (majorVersion === null) {
    throw new FileEnvelopeError(
      `File has an unrecognized version "${meta.version}"`,
    );
  }
  if (majorVersion > expectation.supportedMajorVersion) {
    throw new FileEnvelopeError(
      `This file was created by a newer version of ${LABELS.APP_NAME} and cannot be imported. Update ${LABELS.APP_NAME} and try again.`,
    );
  }

  return result.data;
}

/** Extracts the leading integer of a semver-style `"major.minor"` string. */
function parseMajorVersion(version: string): number | null {
  const major = Number.parseInt(version, 10);
  return Number.isNaN(major) ? null : major;
}
