// @vitest-environment happy-dom
import { describe, expect, test, vi } from "vitest";

import type { VertexType, EdgeType } from "@/core/entities";
import type {
  VertexStyleStorage,
  EdgeStyleStorage,
} from "@/core/StateProvider/graphStyles";

import { getAppStore } from "@/core";
import { createEdgeType, createVertexType } from "@/core/entities";
import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import { renderHookWithJotai } from "@/utils/testing";

import {
  getStylingConflicts,
  parseStylingFile,
  useApplyStylingImport,
  useExportStylingFile,
} from "./useStylingImportExport";

vi.mock("@/utils/fileData", () => ({
  toJsonFileData: vi.fn(),
  fromFileToJson: vi.fn(),
  saveFile: vi.fn(),
}));

describe("styling import", () => {
  test("parseStylingFile + applyImport writes styles to user atoms", async () => {
    const { result } = renderHookWithJotai(() => useApplyStylingImport());

    const file = createStylingFile({
      vertices: {
        Person: { color: "#ff0000", shape: "star" },
        Airport: { color: "#00ff00" },
      },
      edges: {
        route: { lineColor: "#0000ff" },
      },
    });

    const parsed = await parseStylingFile(file);
    result.current(parsed);

    const store = getAppStore();
    const vertexStyles = store.get(userVertexStylesAtom);
    expect(vertexStyles.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      color: "#ff0000",
      shape: "star",
    });
    expect(vertexStyles.get(createVertexType("Airport"))).toStrictEqual({
      type: createVertexType("Airport"),
      color: "#00ff00",
    });

    const edgeStyles = store.get(userEdgeStylesAtom);
    expect(edgeStyles.get(createEdgeType("route"))).toStrictEqual({
      type: createEdgeType("route"),
      lineColor: "#0000ff",
    });
  });

  test("merges new import with existing user styles", async () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexStyleStorage>([
        [
          createVertexType("OldType"),
          { type: createVertexType("OldType"), color: "#old" },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useApplyStylingImport());

    const file = createStylingFile({
      vertices: { NewType: { color: "#new" } },
      edges: {},
    });

    const parsed = await parseStylingFile(file);
    result.current(parsed);

    const vertexStyles = store.get(userVertexStylesAtom);
    expect(vertexStyles.has(createVertexType("OldType"))).toBe(true);
    expect(vertexStyles.has(createVertexType("NewType"))).toBe(true);
  });

  test("getStylingConflicts identifies overlapping keys", () => {
    const userVertexStyles = new Map<VertexType, VertexStyleStorage>([
      [
        createVertexType("Person"),
        { type: createVertexType("Person"), color: "#existing" },
      ],
    ]);
    const userEdgeStyles = new Map<EdgeType, EdgeStyleStorage>([
      [
        createEdgeType("knows"),
        { type: createEdgeType("knows"), lineColor: "#old" },
      ],
    ]);

    const parsed = {
      vertexStyles: new Map<VertexType, VertexStyleStorage>([
        [
          createVertexType("Person"),
          { type: createVertexType("Person"), color: "#new" },
        ],
        [
          createVertexType("Airport"),
          { type: createVertexType("Airport"), color: "#fresh" },
        ],
      ]),
      edgeStyles: new Map<EdgeType, EdgeStyleStorage>([
        [
          createEdgeType("knows"),
          { type: createEdgeType("knows"), lineColor: "#new" },
        ],
      ]),
    };

    const conflicts = getStylingConflicts(
      parsed,
      userVertexStyles,
      userEdgeStyles,
    );
    expect(conflicts).toStrictEqual({
      vertices: ["Person"],
      edges: ["knows"],
    });
  });

  test("getStylingConflicts returns empty when no overlap", () => {
    const parsed = {
      vertexStyles: new Map<VertexType, VertexStyleStorage>([
        [
          createVertexType("Brand New"),
          { type: createVertexType("Brand New"), color: "#aaa" },
        ],
      ]),
      edgeStyles: new Map<EdgeType, EdgeStyleStorage>(),
    };

    const conflicts = getStylingConflicts(
      parsed,
      new Map<VertexType, VertexStyleStorage>(),
      new Map<EdgeType, EdgeStyleStorage>(),
    );
    expect(conflicts).toStrictEqual({ vertices: [], edges: [] });
  });

  test("throws for invalid file", async () => {
    const file = new File(["not json"], "bad.json", {
      type: "application/json",
    });

    await expect(parseStylingFile(file)).rejects.toThrow(
      "File is not valid JSON",
    );
  });

  test("throws for wrong kind", async () => {
    const envelope = {
      meta: {
        kind: "connection-export",
        version: "1.0",
        timestamp: "2026-01-01T00:00:00Z",
        source: "Graph Explorer",
        sourceVersion: "3.2.0",
      },
      data: { vertices: {}, edges: {} },
    };
    const file = new File([JSON.stringify(envelope)], "conn.json", {
      type: "application/json",
    });

    await expect(parseStylingFile(file)).rejects.toThrow(
      'Expected a "styling-export" file, but got "connection-export"',
    );
  });

  test("throws when the file was made by a newer generation", async () => {
    const envelope = {
      meta: {
        kind: "styling-export",
        version: 2,
        timestamp: "2026-01-01T00:00:00Z",
        source: "Graph Explorer",
        sourceVersion: "9.9.9",
      },
      data: { vertices: {}, edges: {} },
    };
    const file = new File([JSON.stringify(envelope)], "styles.json", {
      type: "application/json",
    });

    await expect(parseStylingFile(file)).rejects.toThrow(
      /newer version of Graph Explorer/,
    );
  });
});

describe("useExportStylingFile", () => {
  test("exports user styles", () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexStyleStorage>([
        [
          createVertexType("Person"),
          {
            type: createVertexType("Person"),
            color: "#user",
            shape: "star",
          },
        ],
      ]),
    );
    store.set(
      userEdgeStylesAtom,
      new Map<EdgeType, EdgeStyleStorage>([
        [
          createEdgeType("route"),
          { type: createEdgeType("route"), lineColor: "#edge-user" },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useExportStylingFile());

    const payload = result.current.getExportPayload();

    expect(payload.vertices).toStrictEqual({
      Person: { color: "#user", shape: "star" },
    });
    expect(payload.edges).toStrictEqual({
      route: { lineColor: "#edge-user" },
    });
  });

  test("returns empty payload when no styles exist", () => {
    const { result } = renderHookWithJotai(() => useExportStylingFile());
    const payload = result.current.getExportPayload();

    expect(payload).toStrictEqual({ vertices: {}, edges: {} });
  });

  test("renames iconUrl to icon in the file format", () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexStyleStorage>([
        [
          createVertexType("Airport"),
          {
            type: createVertexType("Airport"),
            iconUrl: "lucide:plane",
            iconImageType: "image/svg+xml",
            color: "#123",
          },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useExportStylingFile());
    const payload = result.current.getExportPayload();

    expect(payload.vertices["Airport"]).toStrictEqual({
      icon: "lucide:plane",
      iconImageType: "image/svg+xml",
      color: "#123",
    });
    expect("iconUrl" in payload.vertices["Airport"]).toBe(false);
  });
});

function createStylingFile(data: {
  vertices: Record<string, Record<string, unknown>>;
  edges: Record<string, Record<string, unknown>>;
}) {
  const envelope = {
    meta: {
      kind: "styling-export",
      version: 1,
      timestamp: "2026-06-24T00:00:00.000Z",
      source: "Graph Explorer",
      sourceVersion: "3.2.0",
    },
    data,
  };
  return new File([JSON.stringify(envelope)], "styles.json", {
    type: "application/json",
  });
}
