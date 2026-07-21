import { useAtomValue, useSetAtom } from "jotai";

import { parseFileEnvelope } from "@/core/fileEnvelope";
import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

import type { StylingParseResult } from "./stylingParser";
import type {
  EdgeStyleFileEntry,
  StylingExportPayload,
  VertexStyleFileEntry,
} from "./stylingParser";

import {
  parseStylingPayloadForVersion,
  STYLING_EXPORT_KIND,
  STYLING_EXPORT_VERSION,
  toEdgeFileEntry,
  toVertexFileEntry,
} from "./stylingParser";

/**
 * Parses a styling export file. Throws {@link FileEnvelopeError} if the file is
 * not valid JSON, lacks the envelope structure, is the wrong kind, or was
 * created by a newer version; and {@link StylingParseError} (carrying the
 * offending locations) if any payload value is invalid. Import is atomic — a
 * successful parse means the whole file is valid.
 */
export async function parseStylingFile(
  file: File,
): Promise<StylingParseResult> {
  const envelope = await parseFileEnvelope(file, {
    kind: STYLING_EXPORT_KIND,
    supportedVersion: STYLING_EXPORT_VERSION,
  });
  return parseStylingPayloadForVersion(envelope.meta.version, envelope.data);
}

/** Merges a parsed styling file into the user styles. */
export function useApplyStylingImport() {
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);

  return function applyImport(parsed: StylingParseResult): void {
    setUserVertexStyles(prev => {
      const merged = new Map(prev);
      for (const [type, style] of parsed.vertexStyles) {
        merged.set(type, style);
      }
      return merged;
    });
    setUserEdgeStyles(prev => {
      const merged = new Map(prev);
      for (const [type, style] of parsed.edgeStyles) {
        merged.set(type, style);
      }
      return merged;
    });
  };
}

export function useExportStylingFile() {
  const userVertexStyles = useAtomValue(userVertexStylesAtom);
  const userEdgeStyles = useAtomValue(userEdgeStylesAtom);

  function getExportPayload(): StylingExportPayload {
    const vertices: Record<string, VertexStyleFileEntry> = {};
    for (const [type, style] of userVertexStyles) {
      vertices[type] = toVertexFileEntry(style);
    }

    const edges: Record<string, EdgeStyleFileEntry> = {};
    for (const [type, style] of userEdgeStyles) {
      edges[type] = toEdgeFileEntry(style);
    }

    return { vertices, edges };
  }

  return { getExportPayload };
}
