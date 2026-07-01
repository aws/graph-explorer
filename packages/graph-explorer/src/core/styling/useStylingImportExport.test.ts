// @vitest-environment happy-dom
import { describe, expect, test, vi } from "vitest";

import type { VertexType, EdgeType } from "@/core/entities";
import type {
  VertexPreferencesStorageModel,
  EdgePreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { getAppStore } from "@/core";
import { createEdgeType, createVertexType } from "@/core/entities";
import {
  sharedVertexStylesAtom,
  sharedEdgeStylesAtom,
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
  test("parseStylingFile + applyImport writes styles to shared atoms", async () => {
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
    const vertexStyles = store.get(sharedVertexStylesAtom);
    expect(vertexStyles.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      color: "#ff0000",
      shape: "star",
    });
    expect(vertexStyles.get(createVertexType("Airport"))).toStrictEqual({
      type: createVertexType("Airport"),
      color: "#00ff00",
    });

    const edgeStyles = store.get(sharedEdgeStylesAtom);
    expect(edgeStyles.get(createEdgeType("route"))).toStrictEqual({
      type: createEdgeType("route"),
      lineColor: "#0000ff",
    });
  });

  test("does not modify user atoms on import", async () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("Person"),
          { type: createVertexType("Person"), color: "#111" },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useApplyStylingImport());

    const file = createStylingFile({
      vertices: { Person: { color: "#999" } },
      edges: {},
    });

    const parsed = await parseStylingFile(file);
    result.current(parsed);

    const userStyles = store.get(userVertexStylesAtom);
    expect(userStyles.get(createVertexType("Person"))?.color).toBe("#111");
  });

  test("merges new import with existing shared styles", async () => {
    const store = getAppStore();
    store.set(
      sharedVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
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

    const vertexStyles = store.get(sharedVertexStylesAtom);
    expect(vertexStyles.has(createVertexType("OldType"))).toBe(true);
    expect(vertexStyles.has(createVertexType("NewType"))).toBe(true);
  });

  test("getStylingConflicts identifies overlapping keys", () => {
    const sharedVertexStyles = new Map<
      VertexType,
      VertexPreferencesStorageModel
    >([
      [
        createVertexType("Person"),
        { type: createVertexType("Person"), color: "#existing" },
      ],
    ]);
    const sharedEdgeStyles = new Map<EdgeType, EdgePreferencesStorageModel>([
      [
        createEdgeType("knows"),
        { type: createEdgeType("knows"), lineColor: "#old" },
      ],
    ]);

    const parsed = {
      vertexStyles: new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("Person"),
          { type: createVertexType("Person"), color: "#new" },
        ],
        [
          createVertexType("Airport"),
          { type: createVertexType("Airport"), color: "#fresh" },
        ],
      ]),
      edgeStyles: new Map<EdgeType, EdgePreferencesStorageModel>([
        [
          createEdgeType("knows"),
          { type: createEdgeType("knows"), lineColor: "#new" },
        ],
      ]),
    };

    const conflicts = getStylingConflicts(
      parsed,
      sharedVertexStyles,
      sharedEdgeStyles,
    );
    expect(conflicts).toStrictEqual({
      vertices: ["Person"],
      edges: ["knows"],
    });
  });

  test("getStylingConflicts returns empty when no overlap", () => {
    const parsed = {
      vertexStyles: new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("Brand New"),
          { type: createVertexType("Brand New"), color: "#aaa" },
        ],
      ]),
      edgeStyles: new Map<EdgeType, EdgePreferencesStorageModel>(),
    };

    const conflicts = getStylingConflicts(
      parsed,
      new Map<VertexType, VertexPreferencesStorageModel>(),
      new Map<EdgeType, EdgePreferencesStorageModel>(),
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
        sourceVersion: "3.0.0",
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
  test("exports merged user+shared styles with user winning", () => {
    const store = getAppStore();
    store.set(
      sharedVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("Person"),
          {
            type: createVertexType("Person"),
            color: "#shared",
            shape: "star",
          },
        ],
      ]),
    );
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("Person"),
          { type: createVertexType("Person"), color: "#user" },
        ],
      ]),
    );
    store.set(
      sharedEdgeStylesAtom,
      new Map<EdgeType, EdgePreferencesStorageModel>([
        [
          createEdgeType("route"),
          { type: createEdgeType("route"), lineColor: "#edge-shared" },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useExportStylingFile());

    const payload = result.current.getExportPayload();

    expect(payload.vertices).toStrictEqual({
      Person: { color: "#user", shape: "star" },
    });
    expect(payload.edges).toStrictEqual({
      route: { lineColor: "#edge-shared" },
    });
  });

  test("exports types only present in user layer", () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("City"),
          { type: createVertexType("City"), color: "#city" },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useExportStylingFile());
    const payload = result.current.getExportPayload();

    expect(payload.vertices).toStrictEqual({ City: { color: "#city" } });
    expect(payload.edges).toStrictEqual({});
  });

  test("exports types only present in shared layer", () => {
    const store = getAppStore();
    store.set(
      sharedEdgeStylesAtom,
      new Map<EdgeType, EdgePreferencesStorageModel>([
        [
          createEdgeType("likes"),
          { type: createEdgeType("likes"), lineStyle: "dashed" },
        ],
      ]),
    );

    const { result } = renderHookWithJotai(() => useExportStylingFile());
    const payload = result.current.getExportPayload();

    expect(payload.vertices).toStrictEqual({});
    expect(payload.edges).toStrictEqual({ likes: { lineStyle: "dashed" } });
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
      new Map<VertexType, VertexPreferencesStorageModel>([
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
      version: "1.0",
      timestamp: "2026-06-24T00:00:00.000Z",
      source: "Graph Explorer",
      sourceVersion: "3.0.0",
    },
    data,
  };
  return new File([JSON.stringify(envelope)], "styles.json", {
    type: "application/json",
  });
}
