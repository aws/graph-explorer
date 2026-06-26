// @vitest-environment happy-dom
import { describe, expect, test, vi } from "vitest";

import type { VertexType, EdgeType } from "@/core/entities";
import type {
  VertexPreferencesStorageModel,
  EdgePreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { getAppStore } from "@/core";
import { createEdgeType, createVertexType } from "@/core/entities";
import { createFileEnvelope } from "@/core/fileEnvelope";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import { renderHookWithJotai } from "@/utils/testing";

import {
  useExportStylingFile,
  useImportStylingFile,
} from "./useStylingImportExport";

vi.mock("@/utils/fileData", () => ({
  toJsonFileData: vi.fn(),
  fromFileToJson: vi.fn(),
  saveFile: vi.fn(),
}));

describe("round-trip: export then import", () => {
  test("property graph types with lucide icons survive round-trip", async () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("airport"),
          {
            type: createVertexType("airport"),
            displayNameAttribute: "code",
            iconUrl: "lucide:anchor",
            iconImageType: "image/svg+xml",
            color: "#e66412",
          },
        ],
        [
          createVertexType("country"),
          {
            type: createVertexType("country"),
            color: "#e612b8",
          },
        ],
      ]),
    );
    store.set(
      userEdgeStylesAtom,
      new Map<EdgeType, EdgePreferencesStorageModel>([
        [
          createEdgeType("route"),
          {
            type: createEdgeType("route"),
            lineThickness: 1,
            labelColor: "#eef4ff",
            labelBackgroundOpacity: 1,
            lineColor: "#0c4a6e",
          },
        ],
      ]),
    );

    const { result: exportResult } = renderHookWithJotai(() =>
      useExportStylingFile(),
    );
    const payload = exportResult.current.getExportPayload();

    expect(payload.vertices["airport"]).toStrictEqual({
      displayNameAttribute: "code",
      icon: "lucide:anchor",
      iconImageType: "image/svg+xml",
      color: "#e66412",
    });
    expect(payload.vertices["country"]).toStrictEqual({
      color: "#e612b8",
    });
    expect(payload.edges["route"]).toStrictEqual({
      lineThickness: 1,
      labelColor: "#eef4ff",
      labelBackgroundOpacity: 1,
      lineColor: "#0c4a6e",
    });

    const file = envelopeToFile(payload);

    store.set(userVertexStylesAtom, new Map());
    store.set(userEdgeStylesAtom, new Map());

    const { result: importResult } = renderHookWithJotai(() =>
      useImportStylingFile(),
    );
    const parseOut = await importResult.current.parseFile(file);

    importResult.current.applyImport(parseOut);

    expect(parseOut.issues).toStrictEqual([]);

    const importedVertices = store.get(importedVertexStylesAtom);
    expect(importedVertices.get(createVertexType("airport"))).toStrictEqual({
      type: createVertexType("airport"),
      displayNameAttribute: "code",
      iconUrl: "lucide:anchor",
      iconImageType: "image/svg+xml",
      color: "#e66412",
    });
    expect(importedVertices.get(createVertexType("country"))).toStrictEqual({
      type: createVertexType("country"),
      color: "#e612b8",
    });

    const importedEdges = store.get(importedEdgeStylesAtom);
    expect(importedEdges.get(createEdgeType("route"))).toStrictEqual({
      type: createEdgeType("route"),
      lineThickness: 1,
      labelColor: "#eef4ff",
      labelBackgroundOpacity: 1,
      lineColor: "#0c4a6e",
    });
  });

  test("RDF URI vertex types survive round-trip", async () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("http://data.nobelprize.org/terms/LaureateAward"),
          {
            type: createVertexType(
              "http://data.nobelprize.org/terms/LaureateAward",
            ),
            iconUrl: "lucide:alarm-clock-check",
            iconImageType: "image/svg+xml",
            color: "#1229e6",
          },
        ],
        [
          createVertexType("http://data.nobelprize.org/terms/Laureate"),
          {
            type: createVertexType("http://data.nobelprize.org/terms/Laureate"),
            iconUrl: "lucide:angry",
            iconImageType: "image/svg+xml",
            color: "#ba12e6",
          },
        ],
        [
          createVertexType("http://www.w3.org/ns/dcat#Catalog"),
          {
            type: createVertexType("http://www.w3.org/ns/dcat#Catalog"),
            iconUrl: "lucide:alert-octagon",
            iconImageType: "image/svg+xml",
          },
        ],
        [
          createVertexType("http://dbpedia.org/ontology/Award"),
          {
            type: createVertexType("http://dbpedia.org/ontology/Award"),
            displayNameAttribute: "http://www.w3.org/2000/01/rdf-schema#label",
          },
        ],
      ]),
    );

    const { result: exportResult } = renderHookWithJotai(() =>
      useExportStylingFile(),
    );
    const payload = exportResult.current.getExportPayload();
    const file = envelopeToFile(payload);

    store.set(userVertexStylesAtom, new Map());

    const { result: importResult } = renderHookWithJotai(() =>
      useImportStylingFile(),
    );
    const parseOut = await importResult.current.parseFile(file);

    importResult.current.applyImport(parseOut);

    expect(parseOut.issues).toStrictEqual([]);

    const imported = store.get(importedVertexStylesAtom);
    expect(
      imported.get(
        createVertexType("http://data.nobelprize.org/terms/LaureateAward"),
      ),
    ).toStrictEqual({
      type: createVertexType("http://data.nobelprize.org/terms/LaureateAward"),
      iconUrl: "lucide:alarm-clock-check",
      iconImageType: "image/svg+xml",
      color: "#1229e6",
    });
    expect(
      imported.get(
        createVertexType("http://data.nobelprize.org/terms/Laureate"),
      ),
    ).toStrictEqual({
      type: createVertexType("http://data.nobelprize.org/terms/Laureate"),
      iconUrl: "lucide:angry",
      iconImageType: "image/svg+xml",
      color: "#ba12e6",
    });
    expect(
      imported.get(createVertexType("http://www.w3.org/ns/dcat#Catalog")),
    ).toStrictEqual({
      type: createVertexType("http://www.w3.org/ns/dcat#Catalog"),
      iconUrl: "lucide:alert-octagon",
      iconImageType: "image/svg+xml",
    });
    expect(
      imported.get(createVertexType("http://dbpedia.org/ontology/Award")),
    ).toStrictEqual({
      type: createVertexType("http://dbpedia.org/ontology/Award"),
      displayNameAttribute: "http://www.w3.org/2000/01/rdf-schema#label",
    });
  });

  test("SVG base64 data URI icons survive round-trip", async () => {
    const svgDataUri =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==";

    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("CustomNode"),
          {
            type: createVertexType("CustomNode"),
            iconUrl: svgDataUri,
            iconImageType: "image/svg+xml",
            color: "#333",
          },
        ],
      ]),
    );

    const { result: exportResult } = renderHookWithJotai(() =>
      useExportStylingFile(),
    );
    const payload = exportResult.current.getExportPayload();

    expect(payload.vertices["CustomNode"].icon).toBe(svgDataUri);

    const file = envelopeToFile(payload);
    store.set(userVertexStylesAtom, new Map());

    const { result: importResult } = renderHookWithJotai(() =>
      useImportStylingFile(),
    );
    const parseOut = await importResult.current.parseFile(file);

    importResult.current.applyImport(parseOut);

    expect(parseOut.issues).toStrictEqual([]);

    const imported = store.get(importedVertexStylesAtom);
    expect(imported.get(createVertexType("CustomNode"))!.iconUrl).toBe(
      svgDataUri,
    );
  });

  test("raster image base64 data URI icons survive round-trip", async () => {
    const pngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    const jpegDataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("PngNode"),
          {
            type: createVertexType("PngNode"),
            iconUrl: pngDataUri,
            iconImageType: "image/png",
            color: "#111",
          },
        ],
        [
          createVertexType("JpegNode"),
          {
            type: createVertexType("JpegNode"),
            iconUrl: jpegDataUri,
            iconImageType: "image/jpeg",
            color: "#222",
          },
        ],
      ]),
    );

    const { result: exportResult } = renderHookWithJotai(() =>
      useExportStylingFile(),
    );
    const payload = exportResult.current.getExportPayload();
    const file = envelopeToFile(payload);

    store.set(userVertexStylesAtom, new Map());

    const { result: importResult } = renderHookWithJotai(() =>
      useImportStylingFile(),
    );
    const parseOut = await importResult.current.parseFile(file);

    importResult.current.applyImport(parseOut);

    expect(parseOut.issues).toStrictEqual([]);

    const imported = store.get(importedVertexStylesAtom);
    expect(imported.get(createVertexType("PngNode"))).toStrictEqual({
      type: createVertexType("PngNode"),
      iconUrl: pngDataUri,
      iconImageType: "image/png",
      color: "#111",
    });
    expect(imported.get(createVertexType("JpegNode"))).toStrictEqual({
      type: createVertexType("JpegNode"),
      iconUrl: jpegDataUri,
      iconImageType: "image/jpeg",
      color: "#222",
    });
  });

  test("HTTP/HTTPS URL icons are dropped on import (no outbound requests)", async () => {
    const httpsUrl = "https://cdn.example.com/icons/airport.png";
    const httpUrl = "http://internal.corp/icon.svg";

    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("HttpsNode"),
          {
            type: createVertexType("HttpsNode"),
            iconUrl: httpsUrl,
            iconImageType: "image/png",
          },
        ],
        [
          createVertexType("HttpNode"),
          {
            type: createVertexType("HttpNode"),
            iconUrl: httpUrl,
            iconImageType: "image/svg+xml",
          },
        ],
      ]),
    );

    const { result: exportResult } = renderHookWithJotai(() =>
      useExportStylingFile(),
    );
    const payload = exportResult.current.getExportPayload();
    const file = envelopeToFile(payload);

    store.set(userVertexStylesAtom, new Map());

    const { result: importResult } = renderHookWithJotai(() =>
      useImportStylingFile(),
    );
    const parseOut = await importResult.current.parseFile(file);

    importResult.current.applyImport(parseOut);

    // Both icons fail the allowlist, so each entry's only field is dropped and
    // the icon issue is reported. iconImageType still survives for HttpsNode.
    expect(parseOut.issues.map(i => i.field)).toStrictEqual(["icon", "icon"]);

    const imported = store.get(importedVertexStylesAtom);
    expect(
      imported.get(createVertexType("HttpsNode"))?.iconUrl,
    ).toBeUndefined();
    expect(imported.get(createVertexType("HttpNode"))?.iconUrl).toBeUndefined();
  });

  test("mixed icon types in a single export all survive round-trip", async () => {
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexPreferencesStorageModel>([
        [
          createVertexType("LucideType"),
          {
            type: createVertexType("LucideType"),
            iconUrl: "lucide:user",
            iconImageType: "image/svg+xml",
          },
        ],
        [
          createVertexType("SvgDataType"),
          {
            type: createVertexType("SvgDataType"),
            iconUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
            iconImageType: "image/svg+xml",
          },
        ],
        [
          createVertexType("PngDataType"),
          {
            type: createVertexType("PngDataType"),
            iconUrl: "data:image/png;base64,iVBORw0KGgo=",
            iconImageType: "image/png",
          },
        ],
        [
          createVertexType("NoIconType"),
          {
            type: createVertexType("NoIconType"),
            color: "#abc",
            shape: "diamond",
          },
        ],
      ]),
    );

    const { result: exportResult } = renderHookWithJotai(() =>
      useExportStylingFile(),
    );
    const payload = exportResult.current.getExportPayload();
    const file = envelopeToFile(payload);

    store.set(userVertexStylesAtom, new Map());

    const { result: importResult } = renderHookWithJotai(() =>
      useImportStylingFile(),
    );
    const parseOut = await importResult.current.parseFile(file);

    importResult.current.applyImport(parseOut);

    expect(parseOut.issues).toStrictEqual([]);

    const imported = store.get(importedVertexStylesAtom);
    expect(imported.get(createVertexType("LucideType"))!.iconUrl).toBe(
      "lucide:user",
    );
    expect(imported.get(createVertexType("SvgDataType"))!.iconUrl).toBe(
      "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    );
    expect(imported.get(createVertexType("PngDataType"))!.iconUrl).toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
    expect(imported.get(createVertexType("NoIconType"))).toStrictEqual({
      type: createVertexType("NoIconType"),
      color: "#abc",
      shape: "diamond",
    });
  });

  test("importing the exact file from the bug report succeeds without issues", async () => {
    const fileContent = JSON.stringify({
      meta: {
        kind: "styling-export",
        version: "1.0",
        timestamp: "2026-06-25T14:35:09.186Z",
        source: "Graph Explorer",
        sourceVersion: "3.1.0",
      },
      data: {
        vertices: {
          "http://data.nobelprize.org/terms/LaureateAward": {
            icon: "lucide:alarm-clock-check",
            iconImageType: "image/svg+xml",
            color: "#1229e6",
          },
          "http://data.nobelprize.org/terms/Laureate": {
            icon: "lucide:angry",
            iconImageType: "image/svg+xml",
            color: "#ba12e6",
          },
          "http://www.w3.org/ns/dcat#Catalog": {
            icon: "lucide:alert-octagon",
            iconImageType: "image/svg+xml",
          },
          airport: {
            displayNameAttribute: "code",
            icon: "lucide:anchor",
            iconImageType: "image/svg+xml",
            color: "#e66412",
          },
          "http://dbpedia.org/ontology/Award": {
            displayNameAttribute: "http://www.w3.org/2000/01/rdf-schema#label",
          },
          country: { color: "#e612b8" },
        },
        edges: {
          route: {
            lineThickness: 1,
            labelColor: "#eef4ff",
            labelBackgroundOpacity: 1,
            lineColor: "#0c4a6e",
          },
        },
      },
    });

    const file = new File([fileContent], "graph-explorer-styles.json", {
      type: "application/json",
    });

    const { result } = renderHookWithJotai(() => useImportStylingFile());
    const parseOut = await result.current.parseFile(file);

    result.current.applyImport(parseOut);

    expect(parseOut.issues).toStrictEqual([]);

    const store = getAppStore();
    const imported = store.get(importedVertexStylesAtom);

    expect(
      imported.get(
        createVertexType("http://data.nobelprize.org/terms/LaureateAward"),
      ),
    ).toStrictEqual({
      type: createVertexType("http://data.nobelprize.org/terms/LaureateAward"),
      iconUrl: "lucide:alarm-clock-check",
      iconImageType: "image/svg+xml",
      color: "#1229e6",
    });

    expect(imported.get(createVertexType("airport"))).toStrictEqual({
      type: createVertexType("airport"),
      displayNameAttribute: "code",
      iconUrl: "lucide:anchor",
      iconImageType: "image/svg+xml",
      color: "#e66412",
    });

    expect(imported.get(createVertexType("country"))).toStrictEqual({
      type: createVertexType("country"),
      color: "#e612b8",
    });

    const importedEdges = store.get(importedEdgeStylesAtom);
    expect(importedEdges.get(createEdgeType("route"))).toStrictEqual({
      type: createEdgeType("route"),
      lineThickness: 1,
      labelColor: "#eef4ff",
      labelBackgroundOpacity: 1,
      lineColor: "#0c4a6e",
    });
  });
});

function envelopeToFile(payload: unknown): File {
  const envelope = createFileEnvelope("styling-export", "1.0", payload);
  return new File([JSON.stringify(envelope)], "styles.json", {
    type: "application/json",
  });
}
