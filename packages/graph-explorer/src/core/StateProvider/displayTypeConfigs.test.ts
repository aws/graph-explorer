import {
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import {
  defaultEdgeTypeConfig,
  getDefaultVertexTypeConfig,
} from "./configuration";
import {
  useDisplayEdgeTypeConfig,
  useDisplayVertexTypeConfig,
  mapToDisplayVertexTypeConfig,
} from "./displayTypeConfigs";
import { createRandomName } from "@shared/utils/testing";
import { MISSING_DISPLAY_TYPE } from "@/utils";
import type { TextTransformer } from "@/hooks";

// Simple identity text transformer for testing (non-SPARQL behavior)
const identityTextTransform: TextTransformer = (text: string) => text;

describe("useDisplayVertexTypeConfig", () => {
  it("should use default values when the vertex type is not in the schema", () => {
    const vtConfig = createRandomVertexTypeConfig();
    const defaultConfig = getDefaultVertexTypeConfig(vtConfig.type);

    const { result } = renderHookWithState(() =>
      useDisplayVertexTypeConfig(vtConfig.type)
    );

    expect(result.current.type).toBe(vtConfig.type);
    expect(result.current.displayLabel).toBe(vtConfig.type);
    expect(result.current.displayNameAttribute).toBe(
      defaultConfig.displayNameAttribute
    );
    expect(result.current.displayDescriptionAttribute).toBe(
      defaultConfig.longDisplayNameAttribute
    );
    expect(result.current.style).toEqual({
      color: defaultConfig.color,
      iconImageType: defaultConfig.iconImageType,
      iconUrl: defaultConfig.iconUrl,
    });
  });

  it("should use missing value string when type is empty", () => {
    const { result } = renderHookWithState(() =>
      useDisplayVertexTypeConfig("")
    );

    expect(result.current.displayLabel).toBe(MISSING_DISPLAY_TYPE);
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

  it("should have display name attribute from the config", () => {
    const dbState = new DbState();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.displayNameAttribute = createRandomName("displayNameAttribute");
    dbState.activeSchema.vertices.push(vtConfig);

    const { result } = renderHookWithState(
      () => useDisplayVertexTypeConfig(vtConfig.type),
      dbState
    );

    expect(result.current.displayNameAttribute).toBe(
      vtConfig.displayNameAttribute
    );
  });

  it("should have display description attribute from the config", () => {
    const dbState = new DbState();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.longDisplayNameAttribute = createRandomName(
      "longDisplayNameAttribute"
    );
    dbState.activeSchema.vertices.push(vtConfig);

    const { result } = renderHookWithState(
      () => useDisplayVertexTypeConfig(vtConfig.type),
      dbState
    );

    expect(result.current.displayDescriptionAttribute).toBe(
      vtConfig.longDisplayNameAttribute
    );
  });

  it("should have style matching the config", () => {
    const dbState = new DbState();
    const vtConfig = createRandomVertexTypeConfig();
    dbState.activeSchema.vertices.push(vtConfig);

    const { result } = renderHookWithState(
      () => useDisplayVertexTypeConfig(vtConfig.type),
      dbState
    );

    expect(result.current.style.color).toBe(vtConfig.color);
    expect(result.current.style.iconImageType).toBe(vtConfig.iconImageType);
    expect(result.current.style.iconUrl).toBe(vtConfig.iconUrl);
  });
});

describe("mapToDisplayVertexTypeConfig", () => {
  it("should map attributes with display labels", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "firstName", dataType: "String" },
      { name: "age", dataType: "Number" },
    ];

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
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

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      identityTextTransform
    );

    expect(result.attributes.map(a => a.name)).toStrictEqual([
      "apple",
      "middle",
      "zebra",
    ]);
  });

  it("should mark String attributes as searchable by default", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "name", dataType: "String" },
      { name: "email", dataType: "String", searchable: true },
    ];

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
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

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
      identityTextTransform
    );

    expect(result.attributes.every(a => !a.isSearchable)).toBe(true);
  });

  it("should respect searchable: false for String attributes", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "name", dataType: "String", searchable: false },
      { name: "email", dataType: "String", searchable: true },
    ];

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
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
        isSearchable: false,
      },
    ]);
  });

  it("should handle attributes without dataType", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.attributes = [
      { name: "unknown" },
      { name: "name", dataType: "String" },
    ];

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
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

    const result = mapToDisplayVertexTypeConfig(
      vtConfig,
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

    // Custom transformer that uppercases
    const uppercaseTransform: TextTransformer = (text: string) =>
      text.toUpperCase();

    const result = mapToDisplayVertexTypeConfig(vtConfig, uppercaseTransform);

    expect(result.attributes.map(a => a.displayLabel)).toStrictEqual([
      "EMAIL",
      "FIRSTNAME",
      "LASTNAME",
    ]);
  });
});

describe("useDisplayEdgeTypeConfig", () => {
  it("should use default values when type is not in schema", () => {
    const type = createRandomName("type");

    const { result } = renderHookWithState(() =>
      useDisplayEdgeTypeConfig(type)
    );

    expect(result.current.type).toBe(type);
    expect(result.current.displayLabel).toBe(type);
    expect(result.current.displayNameAttribute).toBe(
      defaultEdgeTypeConfig.displayNameAttribute
    );

    const style = result.current.style;
    expect(style.sourceArrowStyle).toBe(defaultEdgeTypeConfig.sourceArrowStyle);
    expect(style.targetArrowStyle).toBe(defaultEdgeTypeConfig.targetArrowStyle);
    expect(style.lineColor).toBe(defaultEdgeTypeConfig.lineColor);
    expect(style.lineStyle).toBe(defaultEdgeTypeConfig.lineStyle);
  });

  it("should use empty label constant when the type is empty", () => {
    const { result } = renderHookWithState(() => useDisplayEdgeTypeConfig(""));

    expect(result.current.displayLabel).toBe(MISSING_DISPLAY_TYPE);
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

  it("should have style matching the config", () => {
    const dbState = new DbState();
    const etConfig = createRandomEdgeTypeConfig();
    dbState.activeSchema.edges.push(etConfig);

    const { result } = renderHookWithState(
      () => useDisplayEdgeTypeConfig(etConfig.type),
      dbState
    );

    expect(result.current.style.sourceArrowStyle).toBe(
      etConfig.sourceArrowStyle
    );
    expect(result.current.style.targetArrowStyle).toBe(
      etConfig.targetArrowStyle
    );
    expect(result.current.style.lineColor).toBe(etConfig.lineColor);
    expect(result.current.style.lineStyle).toBe(etConfig.lineStyle);
  });
});
