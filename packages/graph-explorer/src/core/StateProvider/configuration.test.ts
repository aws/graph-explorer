import { createRandomName } from "@shared/utils/testing";
import { describe, expect, it, test } from "vitest";

import type { NormalizedConnection, RawConfiguration } from "@/connections";

import {
  createEdgeType,
  createVertexType,
  type EdgeType,
  type VertexType,
} from "@/core/entities";
import { RESERVED_TYPES_PROPERTY } from "@/utils";
import {
  createRandomEdgeStyleStorage,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexStyleStorage,
  createRandomVertexTypeConfig,
} from "@/utils/testing";

import type {
  MergedConfiguration,
  VertexTypeConfig,
} from "../ConfigurationProvider";
import type { EdgeStyleStorage, VertexStyleStorage } from "./graphStyles";
import type { SchemaStorageModel } from "./schema";

import {
  defaultEdgeTypeConfig,
  defaultVertexTypeConfig,
  getDefaultEdgeTypeConfig,
  getDefaultVertexTypeConfig,
  mergeConfiguration,
  patchToRemoveDisplayLabel,
} from "./configuration";

function toVertexStyles(
  styles: VertexStyleStorage[] = [],
): Map<VertexType, VertexStyleStorage> {
  return new Map(styles.map(style => [style.type, style]));
}

function toEdgeStyles(
  styles: EdgeStyleStorage[] = [],
): Map<EdgeType, EdgeStyleStorage> {
  return new Map(styles.map(style => [style.type, style]));
}

/** The default empty connection values when no value is provided. */
const defaultEmptyConnection: NormalizedConnection = {
  graphDbUrl: "",
  queryEngine: "gremlin",
  awsAuthEnabled: false,
};

describe("mergedConfiguration", () => {
  it("should produce empty defaults when empty object is passed", () => {
    const config = {} as RawConfiguration;
    const result = mergeConfiguration(null, config, new Map(), new Map());

    expect(result).toEqual({
      connection: defaultEmptyConnection,
      schema: {
        edges: [],
        vertices: [],
        totalEdges: 0,
        totalVertices: 0,
      },
    });
  });

  it("should produce empty schema when no schema provided", () => {
    const config = createRandomRawConfiguration();
    const result = mergeConfiguration(null, config, new Map(), new Map());

    expect(result).toEqual({
      ...config,
      connection: {
        ...defaultEmptyConnection,
        ...config.connection,
      },
      schema: {
        edges: [],
        vertices: [],
        totalEdges: 0,
        totalVertices: 0,
      },
    } satisfies MergedConfiguration);
  });

  it("should use schema when provided", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const result = mergeConfiguration(schema, config, new Map(), new Map());

    const expectedSchema = {
      ...schema,
      vertices: schema.vertices
        .map(v => ({
          ...defaultVertexTypeConfig,
          ...v,
        }))
        .map(patchToRemoveDisplayLabel)
        .toSorted(byType),
      edges: schema.edges
        .map(e => ({
          ...defaultEdgeTypeConfig,
          ...e,
        }))
        .map(patchToRemoveDisplayLabel),
      edgeConnections: schema.edgeConnections,
    } satisfies SchemaStorageModel;

    expect(result.schema?.vertices).toEqual(expectedSchema.vertices);
    expect(result.schema?.edges).toEqual(expectedSchema.edges);
    expect(result.schema?.edgeConnections).toEqual(
      expectedSchema.edgeConnections,
    );
    expect(result.schema).toEqual(expectedSchema);
    expect(result).toEqual({
      ...config,
      connection: {
        ...defaultEmptyConnection,
        ...config.connection,
        graphDbUrl: config.connection?.graphDbUrl ?? "",
      },
      schema: expectedSchema,
    } satisfies MergedConfiguration);
  });

  it("should use styling when provided", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const vertexStyles = toVertexStyles(
      schema.vertices.map(v => ({
        ...createRandomVertexStyleStorage(),
        type: v.type,
      })),
    );
    const edgeStyles = toEdgeStyles(
      schema.edges.map(v => ({
        ...createRandomEdgeStyleStorage(),
        type: v.type,
      })),
    );
    const result = mergeConfiguration(schema, config, vertexStyles, edgeStyles);

    const expectedSchema = {
      ...schema,
      vertices: schema.vertices
        .map(patchToRemoveDisplayLabel)
        .map(v => {
          const style = vertexStyles.get(v.type) ?? {};
          return {
            ...defaultVertexTypeConfig,
            ...v,
            ...style,
          };
        })
        .toSorted(byType),
      edges: schema.edges.map(patchToRemoveDisplayLabel).map(e => {
        const style = edgeStyles.get(e.type) ?? {};
        return {
          ...defaultEdgeTypeConfig,
          ...e,
          ...style,
        };
      }),
      edgeConnections: schema.edgeConnections,
    } satisfies SchemaStorageModel;

    expect(result.schema?.vertices).toEqual(expectedSchema.vertices);
    expect(result.schema?.edges).toEqual(expectedSchema.edges);
    expect(result.schema?.edgeConnections).toEqual(
      expectedSchema.edgeConnections,
    );
    expect(result.schema).toEqual(expectedSchema);
    expect(result).toEqual({
      ...config,
      connection: {
        ...defaultEmptyConnection,
        ...config.connection,
        graphDbUrl: config.connection?.graphDbUrl ?? "",
      },
      schema: expectedSchema,
    });
  });

  it("should have undefined vertex display label when not provided", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();

    const vtConfig = createRandomVertexTypeConfig();
    delete vtConfig.displayLabel;
    schema.vertices = [vtConfig];

    const result = mergeConfiguration(schema, config, new Map(), new Map());

    const actualVtConfig = result.schema?.vertices.find(
      v => v.type === vtConfig.type,
    );

    expect(actualVtConfig?.displayLabel).toBeUndefined();
  });

  it("should have undefined edge display label when not provided", () => {
    const config: RawConfiguration = createRandomRawConfiguration();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    delete etConfig.displayLabel;
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, new Map(), new Map());

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type,
    );

    expect(actualEtConfig?.displayLabel).toBeUndefined();
  });

  it("should prefer vertex styling display label", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.displayLabel = createRandomName("displayLabel");

    const customDisplayLabel = createRandomName("Display Label");

    const config: RawConfiguration = createRandomRawConfiguration();
    const vertexStyles = toVertexStyles([
      {
        type: vtConfig.type,
        displayLabel: customDisplayLabel,
      },
    ]);
    const schema = createRandomSchema();
    schema.vertices = [vtConfig];

    const result = mergeConfiguration(schema, config, vertexStyles, new Map());

    const actualVtConfig = result.schema?.vertices.find(
      v => v.type === vtConfig.type,
    );

    expect(actualVtConfig?.displayLabel).toEqual(customDisplayLabel);
  });

  it("should prefer edge styling display label", () => {
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.displayLabel = createRandomName("displayLabel");

    const customDisplayLabel = createRandomName("Display Label");

    const config: RawConfiguration = createRandomRawConfiguration();
    const edgeStyles = toEdgeStyles([
      {
        type: etConfig.type,
        displayLabel: customDisplayLabel,
      },
    ]);
    const schema = createRandomSchema();
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, new Map(), edgeStyles);

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type,
    );

    expect(actualEtConfig?.displayLabel).toEqual(customDisplayLabel);
  });

  it("should patch displayNameAttribute to be 'types' when it was 'type'", () => {
    const etConfig = createRandomEdgeTypeConfig();

    const config: RawConfiguration = createRandomRawConfiguration();
    const edgeStyles = toEdgeStyles([
      {
        type: etConfig.type,
        displayNameAttribute: "type",
      },
    ]);
    const schema = createRandomSchema();
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, new Map(), edgeStyles);

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type,
    );

    expect(actualEtConfig?.displayNameAttribute).toEqual(
      RESERVED_TYPES_PROPERTY,
    );
  });

  it("should ignore a schema embedded on the stored config and use the active schema", () => {
    // A legacy stored config may carry an embedded schema (the field that was
    // removed from RawConfiguration). The merge must source its schema solely
    // from the active schema argument, never from the stored config.
    const staleVertex = createRandomVertexTypeConfig();
    staleVertex.type = createVertexType("StaleType");
    const staleSchema = createRandomSchema();
    staleSchema.vertices = [staleVertex];

    const config = {
      ...createRandomRawConfiguration(),
      schema: staleSchema,
    } as RawConfiguration & { schema: SchemaStorageModel };

    const activeVertex = createRandomVertexTypeConfig();
    activeVertex.type = createVertexType("ActiveType");
    const activeSchema = createRandomSchema();
    activeSchema.vertices = [activeVertex];

    const result = mergeConfiguration(
      activeSchema,
      config,
      new Map(),
      new Map(),
    );

    expect(result.schema.vertices.map(v => v.type)).toEqual([
      createVertexType("ActiveType"),
    ]);
  });
});

/** Sorts the configs by type name */
function byType(a: VertexTypeConfig, b: VertexTypeConfig) {
  return a.type.localeCompare(b.type);
}

describe("patchToRemoveDisplayLabel", () => {
  it("should remove displayLabel", () => {
    const config = createRandomVertexTypeConfig();
    config.displayLabel = createRandomName("displayLabel");
    config.attributes.forEach(
      a => ((a as any).displayLabel = createRandomName("displayLabel")),
    );
    const result = patchToRemoveDisplayLabel(config);

    expect(result).not.toHaveProperty("displayLabel");
    for (const attr of result.attributes) {
      expect(attr).not.toHaveProperty("displayLabel");
    }
  });

  it("should not mutate the original config", () => {
    const config = createRandomVertexTypeConfig();
    config.displayLabel = createRandomName("displayLabel");
    config.attributes.forEach(
      a => ((a as any).displayLabel = createRandomName("displayLabel")),
    );
    const originalDisplayLabel = config.displayLabel;
    const originalAttrDisplayLabels = config.attributes.map(
      a => (a as any).displayLabel,
    );

    patchToRemoveDisplayLabel(config);

    expect(config.displayLabel).toBe(originalDisplayLabel);
    config.attributes.forEach((a, i) => {
      expect((a as any).displayLabel).toBe(originalAttrDisplayLabels[i]);
    });
  });
});

describe("getDefaultVertexTypeConfig", () => {
  test("should return default config with given type", () => {
    const result = getDefaultVertexTypeConfig(createVertexType("Person"));
    expect(result).toStrictEqual({
      ...defaultVertexTypeConfig,
      type: createVertexType("Person"),
    });
  });
});

describe("getDefaultEdgeTypeConfig", () => {
  test("should return default config with given type", () => {
    const result = getDefaultEdgeTypeConfig(createEdgeType("knows"));
    expect(result).toStrictEqual({
      ...defaultEdgeTypeConfig,
      type: createEdgeType("knows"),
    });
  });
});
