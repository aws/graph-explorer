import { useAtomValue, useSetAtom } from "jotai";

import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgePreferencesStorageModel,
  VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { parseFileEnvelope } from "@/core/fileEnvelope";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
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
 * The types in `parsed` that already have an imported default. These are the
 * entries an import would overwrite, so the caller can warn before applying.
 */
export function getStylingConflicts(
  parsed: StylingParseResult,
  importedVertexStyles: Map<VertexType, VertexPreferencesStorageModel>,
  importedEdgeStyles: Map<EdgeType, EdgePreferencesStorageModel>,
): ImportConflicts {
  const vertices: string[] = [];
  const edges: string[] = [];
  for (const type of parsed.vertexStyles.keys()) {
    if (importedVertexStyles.has(type)) {
      vertices.push(type);
    }
  }
  for (const type of parsed.edgeStyles.keys()) {
    if (importedEdgeStyles.has(type)) {
      edges.push(type);
    }
  }
  return { vertices, edges };
}

/**
 * Merges a parsed styling file into the imported-defaults layer, leaving user
 * customizations untouched.
 */
export function useApplyStylingImport() {
  const setImportedVertexStyles = useSetAtom(importedVertexStylesAtom);
  const setImportedEdgeStyles = useSetAtom(importedEdgeStylesAtom);

  return function applyImport(parsed: StylingParseResult): void {
    setImportedVertexStyles(prev => {
      const merged = new Map(prev);
      for (const [type, style] of parsed.vertexStyles) {
        merged.set(type, style);
      }
      return merged;
    });
    setImportedEdgeStyles(prev => {
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
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  function getExportPayload(): StylingExportPayload {
    const vertices: Record<string, VertexStyleFileEntry> = {};

    const allVertexTypes = new Set<VertexType>([
      ...importedVertexStyles.keys(),
      ...userVertexStyles.keys(),
    ]);
    for (const type of allVertexTypes) {
      const imported = importedVertexStyles.get(type);
      const user = userVertexStyles.get(type);
      vertices[type] = toVertexFileEntry({ type, ...imported, ...user });
    }

    const edges: Record<string, EdgeStyleFileEntry> = {};

    const allEdgeTypes = new Set<EdgeType>([
      ...importedEdgeStyles.keys(),
      ...userEdgeStyles.keys(),
    ]);
    for (const type of allEdgeTypes) {
      const imported = importedEdgeStyles.get(type);
      const user = userEdgeStyles.get(type);
      edges[type] = toEdgeFileEntry({ type, ...imported, ...user });
    }

    return { vertices, edges };
  }

  return { getExportPayload };
}
