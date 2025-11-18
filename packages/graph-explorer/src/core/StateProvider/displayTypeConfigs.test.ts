import {
  createRandomEdgePreferences,
  createRandomEdgeTypeConfig,
  createRandomVertexPreferences,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import {
  useDisplayEdgeTypeConfig,
  useDisplayVertexTypeConfig,
  mapToDisplayVertexTypeConfig,
  mapToDisplayEdgeTypeConfig,
} from "./displayTypeConfigs";
import { createRandomName } from "@shared/utils/testing";
import { LABELS } from "@/utils";
import type { TextTransformer } from "@/hooks";
import { RDFS_LABEL_URI } from "./sortAttributeByName";

// Simple identity text transformer for testing (non-SPARQL behavior)
const identityTextTransform: TextTransformer = (text: string) => text;

describe("useDisplayVertexTypeConfig", () => {
  it("should use default values when the vertex type is not in the schema", () => {
    const vtConfig = createRandomVertexTypeConfig();

    const { result } = renderHookWithState(() =>
      useDisplayVertexTypeConfig(vtConfig.type)
    );

    expect(result.current.type).toBe(vtConfig.type);
    expect(result.current.displayLabel).toBe(vtConfig.type);
  });

  it("should use missing value string when type is empty", () => {
    const { result } = renderHookWithState(() =>
      useDisplayVertexTypeConfig("")
    );

    expect(result.current.displayLabel).toBe(LABELS.MISSING_TYPE);
  });

  it("should ignore display label from schema", () => {
    const dbState = new DbState();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.displayLabel = createRandomName("displayLabel");
    dbState.activeSchema.vertices.push(vtConfig);

    const { result } = renderHookWithState(
      () => useDisplayVertexTypeConfig(vtConfig.type),
      dbState
    );

    expect(result.current.displayLabel).toBe(vtConfig.type);
  });

  it("should use display label from user preferences", () => {
    const dbState = new DbState();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.displayLabel = createRandomName("displayLabel");
    dbState.activeSchema.vertices.push(vtConfig);
    dbState.activeStyling.vertices?.push(vtConfig);

    const { result } = renderHookWithState(
      () => useDisplayVertexTypeConfig(vtConfig.type),
      dbState
    );

    expect(result.current.displayLabel).toBe(vtConfig.displayLabel);
  });
});

describe("mapToDisplayVertexTypeConfig", () => {
  it("should map attributes with display labels", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "firstName", dataType: "String" },
      { name: "age", dataType: "Number" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes).toStrictEqual([
      {
        name: "age",
        displayLabel: "age",
        isSearchable: false,
      },
      {
        name: "firstName",
        displayLabel: "firstName",
        isSearchable: true,
      },
    ]);
  });

  it("should sort attributes alphabetically by name", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "zebra", dataType: "String" },
      { name: "apple", dataType: "String" },
      { name: "middle", dataType: "String" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes.map(a => a.name)).toStrictEqual([
      "apple",
      "middle",
      "zebra",
    ]);
  });

  it("should sort rdfs:label as the first attribute", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "zebra", dataType: "String" },
      { name: RDFS_LABEL_URI, dataType: "String" },
      { name: "apple", dataType: "String" },
      { name: "middle", dataType: "String" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes.map(a => a.name)).toStrictEqual([
      RDFS_LABEL_URI,
      "apple",
      "middle",
      "zebra",
    ]);
  });

  it("should sort rdfs:label first even when it appears last", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "aaa", dataType: "String" },
      { name: "bbb", dataType: "String" },
      { name: "ccc", dataType: "String" },
      { name: RDFS_LABEL_URI, dataType: "String" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes[0].name).toBe(RDFS_LABEL_URI);
    expect(result.attributes.map(a => a.name)).toStrictEqual([
      RDFS_LABEL_URI,
      "aaa",
      "bbb",
      "ccc",
    ]);
  });

  it("should mark String attributes as searchable by default", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "name", dataType: "String" },
      { name: "email", dataType: "String" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes).toStrictEqual([
      {
        name: "email",
        displayLabel: "email",
        isSearchable: true,
      },
      {
        name: "name",
        displayLabel: "name",
        isSearchable: true,
      },
    ]);
  });

  it("should mark non-String attributes as not searchable", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "age", dataType: "Number" },
      { name: "active", dataType: "Boolean" },
      { name: "created", dataType: "Date" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes.every(a => !a.isSearchable)).toBe(true);
  });

  it("should mark non-String attributes as not searchable even when searchable in schema", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "age", dataType: "Number" },
      { name: "active", dataType: "Boolean" },
      { name: "created", dataType: "Date" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes.every(a => !a.isSearchable)).toBe(true);
  });

  it("should handle attributes without dataType", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "unknown" },
      { name: "name", dataType: "String" },
    ];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes).toStrictEqual([
      {
        name: "name",
        displayLabel: "name",
        isSearchable: true,
      },
      {
        name: "unknown",
        displayLabel: "unknown",
        isSearchable: false,
      },
    ]);
  });

  it("should handle empty attributes array", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [];
    const preferences = createRandomVertexPreferences();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes).toStrictEqual([]);
  });

  it("should apply custom text transformer to attribute names", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "firstName", dataType: "String" },
      { name: "lastName", dataType: "String" },
      { name: "email", dataType: "String" },
    ];
    const preferences = createRandomVertexPreferences();

    // Custom transformer that uppercases
    const uppercaseTransform: TextTransformer = (text: string) =>
      text.toUpperCase();

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      preferences,
      uppercaseTransform
    );

    expect(result.attributes.map(a => a.displayLabel)).toStrictEqual([
      "EMAIL",
      "FIRSTNAME",
      "LASTNAME",
    ]);
  });
});

describe("mapToDisplayEdgeTypeConfig", () => {
  it("should sort rdfs:label as the first attribute", () => {
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.attributes = [
      { name: "weight", dataType: "Number" },
      { name: RDFS_LABEL_URI, dataType: "String" },
      { name: "created", dataType: "Date" },
    ];
    const preferences = createRandomEdgePreferences();

    const result = mapToDisplayEdgeTypeConfig(
      etConfig,
      preferences,
      identityTextTransform
    );

    expect(result.attributes.map(a => a.name)).toStrictEqual([
      RDFS_LABEL_URI,
      "created",
      "weight",
    ]);
  });
});

describe("useDisplayEdgeTypeConfig", () => {
  it("should use empty label constant when the type is empty", () => {
    const { result } = renderHookWithState(() => useDisplayEdgeTypeConfig(""));

    expect(result.current.displayLabel).toBe(LABELS.MISSING_TYPE);
  });

  it("should ignore display label from the config", () => {
    const dbState = new DbState();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.displayLabel = createRandomName("displayLabel");
    dbState.activeSchema.edges.push(etConfig);

    const { result } = renderHookWithState(
      () => useDisplayEdgeTypeConfig(etConfig.type),
      dbState
    );

    expect(result.current.displayLabel).toBe(etConfig.type);
  });

  it("should use display label from the user preferences", () => {
    const dbState = new DbState();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.displayLabel = createRandomName("displayLabel");
    dbState.activeSchema.edges.push(etConfig);
    dbState.activeStyling.edges?.push(etConfig);

    const { result } = renderHookWithState(
      () => useDisplayEdgeTypeConfig(etConfig.type),
      dbState
    );

    expect(result.current.displayLabel).toBe(etConfig.displayLabel);
  });
});
