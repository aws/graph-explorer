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
} from "./displayTypeConfigs";
import { createRandomName } from "@shared/utils/testing";
import { MISSING_DISPLAY_TYPE } from "@/utils";

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
