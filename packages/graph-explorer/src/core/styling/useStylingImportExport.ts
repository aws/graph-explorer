import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

import type { EdgeType, VertexType } from "@/core/entities";
import type { EdgePreferencesStorageModel } from "@/core/StateProvider/userPreferences";

import { FileEnvelopeError, parseFileEnvelope } from "@/core/fileEnvelope";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

import type { ImportIssue, StylingParseResult } from "./stylingParser";
import type {
  StylingExportPayload,
  VertexStyleFileEntry,
} from "./stylingParser";

import { parseStylingPayload, toFileEntry } from "./stylingParser";

export type ImportConflicts = {
  vertices: string[];
  edges: string[];
};

export function useImportStylingFile() {
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);
  const setImportedVertexStyles = useSetAtom(importedVertexStylesAtom);
  const setImportedEdgeStyles = useSetAtom(importedEdgeStylesAtom);

  /**
   * Parses a styling export file. Throws {@link FileEnvelopeError} if the file
   * is not valid JSON or lacks the envelope structure, and
   * {@link StylingParseError} if the payload is structurally unusable. Per-field
   * salvage issues are returned in the result (not thrown).
   */
  const parseFile = useCallback(
    async (file: File): Promise<StylingParseResult> => {
      const envelope = await parseFileEnvelope(file);

      if (envelope.meta.kind !== "styling-export") {
        throw new FileEnvelopeError(
          `Expected a styling export file, got "${envelope.meta.kind}"`,
        );
      }

      return parseStylingPayload(envelope.data);
    },
    [],
  );

  const getConflicts = useCallback(
    (parsed: StylingParseResult): ImportConflicts => {
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
    },
    [importedVertexStyles, importedEdgeStyles],
  );

  const applyImport = useCallback(
    (parsed: StylingParseResult): ImportIssue[] => {
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
      return parsed.issues;
    },
    [setImportedVertexStyles, setImportedEdgeStyles],
  );

  return { parseFile, getConflicts, applyImport };
}

export function useExportStylingFile() {
  const userVertexStyles = useAtomValue(userVertexStylesAtom);
  const userEdgeStyles = useAtomValue(userEdgeStylesAtom);
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  const getExportPayload = useCallback((): StylingExportPayload => {
    const vertices: Record<string, VertexStyleFileEntry> = {};

    const allVertexTypes = new Set<VertexType>([
      ...importedVertexStyles.keys(),
      ...userVertexStyles.keys(),
    ]);
    for (const type of allVertexTypes) {
      const imported = importedVertexStyles.get(type);
      const user = userVertexStyles.get(type);
      vertices[type] = toFileEntry({ type, ...imported, ...user });
    }

    const edges: Record<string, Omit<EdgePreferencesStorageModel, "type">> = {};

    const allEdgeTypes = new Set<EdgeType>([
      ...importedEdgeStyles.keys(),
      ...userEdgeStyles.keys(),
    ]);
    for (const type of allEdgeTypes) {
      const imported = importedEdgeStyles.get(type);
      const user = userEdgeStyles.get(type);
      const { type: _type, ...merged } = { ...imported, ...user };
      edges[type] = merged;
    }

    return { vertices, edges };
  }, [
    userVertexStyles,
    userEdgeStyles,
    importedVertexStyles,
    importedEdgeStyles,
  ]);

  return { getExportPayload };
}
