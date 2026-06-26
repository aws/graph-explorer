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

export async function parseFileEnvelope(blob: Blob): Promise<ParsedEnvelope> {
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

  return result.data;
}
