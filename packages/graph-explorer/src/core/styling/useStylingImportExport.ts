import { useAtomValue, useSetAtom } from "jotai";

import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgePreferencesStorageModel,
  VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { parseFileEnvelope } from "@/core/fileEnvelope";
import {
  sharedEdgeStylesAtom,
  sharedVertexStylesAtom,
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

export type ImportConflicts = {
  vertices: string[];
  edges: string[];
};

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

/**
 * The types in `parsed` that already have a shared style. These are the entries
 * a load would overwrite, so the caller can warn before applying.
 */
export function getStylingConflicts(
  parsed: StylingParseResult,
  sharedVertexStyles: Map<VertexType, VertexPreferencesStorageModel>,
  sharedEdgeStyles: Map<EdgeType, EdgePreferencesStorageModel>,
): ImportConflicts {
  const vertices: string[] = [];
  const edges: string[] = [];
  for (const type of parsed.vertexStyles.keys()) {
    if (sharedVertexStyles.has(type)) {
      vertices.push(type);
    }
  }
  for (const type of parsed.edgeStyles.keys()) {
    if (sharedEdgeStyles.has(type)) {
      edges.push(type);
    }
  }
  return { vertices, edges };
}

/**
 * Merges a parsed styling file into the shared-styles layer, leaving user
 * customizations untouched.
 */
export function useApplyStylingImport() {
  const setSharedVertexStyles = useSetAtom(sharedVertexStylesAtom);
  const setSharedEdgeStyles = useSetAtom(sharedEdgeStylesAtom);

  return function applyImport(parsed: StylingParseResult): void {
    setSharedVertexStyles(prev => {
      const merged = new Map(prev);
      for (const [type, style] of parsed.vertexStyles) {
        merged.set(type, style);
      }
      return merged;
    });
    setSharedEdgeStyles(prev => {
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
  const sharedVertexStyles = useAtomValue(sharedVertexStylesAtom);
  const sharedEdgeStyles = useAtomValue(sharedEdgeStylesAtom);

  function getExportPayload(): StylingExportPayload {
    const vertices: Record<string, VertexStyleFileEntry> = {};

    const allVertexTypes = new Set<VertexType>([
      ...sharedVertexStyles.keys(),
      ...userVertexStyles.keys(),
    ]);
    for (const type of allVertexTypes) {
      const shared = sharedVertexStyles.get(type);
      const user = userVertexStyles.get(type);
      vertices[type] = toVertexFileEntry({ type, ...shared, ...user });
    }

    const edges: Record<string, EdgeStyleFileEntry> = {};

    const allEdgeTypes = new Set<EdgeType>([
      ...sharedEdgeStyles.keys(),
      ...userEdgeStyles.keys(),
    ]);
    for (const type of allEdgeTypes) {
      const shared = sharedEdgeStyles.get(type);
      const user = userEdgeStyles.get(type);
      edges[type] = toEdgeFileEntry({ type, ...shared, ...user });
    }

    return { vertices, edges };
  }

  return { getExportPayload };
}
