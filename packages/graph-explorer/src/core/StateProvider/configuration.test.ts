import {
  createRandomEdgePreferences,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexPreferences,
} from "@/utils/testing";
import { mergeConfiguration } from "./configuration";
import { RawConfiguration, VertexTypeConfig } from "../ConfigurationProvider";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";
import { SchemaInference } from "./schema";
import { UserStyling } from "./userPreferences";
import { sanitizeText } from "@/utils";

const defaultVertexStyle = {
  color: "#128EE5",
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
  displayNameAttribute: "id",
  longDisplayNameAttribute: "types",
};

const defaultEdgeStyle = {
  type: "unknown",
  displayLabel: "Unknown",
};

describe("mergedConfiguration", () => {
  it("should produce empty defaults when empty object is passed", () => {
    const config = {} as RawConfiguration;
    const result = mergeConfiguration(null, config, {});

    expect(result).toEqual({
      connection: {
        graphDbUrl: "",
        queryEngine: "gremlin",
        url: "",
      },
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
    const result = mergeConfiguration(null, config, {});

    expect(result).toEqual({
      ...config,
      connection: {
        url: "",
        graphDbUrl: "",
        ...config.connection,
      },
      schema: {
        edges: [],
        vertices: [],
        totalEdges: 0,
        totalVertices: 0,
      },
    } satisfies RawConfiguration);
  });

  it("should use schema when provided", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const result = mergeConfiguration(schema, config, {});

    const expectedSchema = {
      ...schema,
      vertices: schema.vertices
        .map(v => ({
          ...defaultVertexStyle,
          displayLabel: sanitizeText(v.type),
          ...v,
        }))
        .sort(byType),
      edges: schema.edges.map(e => {
        return {
          ...defaultEdgeStyle,
          ...e,
        };
      }),
    } satisfies SchemaInference;

    expect(result.schema?.vertices).toEqual(expectedSchema.vertices);
    expect(result.schema?.edges).toEqual(expectedSchema.edges);
    expect(result.schema).toEqual(expectedSchema);
    expect(result).toEqual({
      ...config,
      connection: {
        ...config.connection,
        url: config.connection?.url ?? "",
        graphDbUrl: config.connection?.graphDbUrl ?? "",
      },
      schema: expectedSchema,
    } satisfies RawConfiguration);
  });

  it("should use styling when provided", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const styling: UserStyling = {
      vertices: schema.vertices.map(v => ({
        ...createRandomVertexPreferences(),
        type: v.type,
      })),
      edges: schema.edges.map(v => ({
        ...createRandomEdgePreferences(),
        type: v.type,
      })),
    };
    const result = mergeConfiguration(schema, config, styling);

    const expectedSchema = {
      ...schema,
      vertices: schema.vertices
        .map(v => {
          const style = styling.vertices?.find(s => s.type === v.type) ?? {};
          return {
            ...defaultVertexStyle,
            displayLabel: sanitizeText(v.type),
            ...v,
            ...style,
          };
        })
        .sort(byType),
      edges: schema.edges.map(e => {
        const style = styling.edges?.find(s => s.type === e.type) ?? {};
        return {
          ...defaultEdgeStyle,
          ...e,
          ...style,
        };
      }),
    } satisfies SchemaInference;

    expect(result.schema?.vertices).toEqual(expectedSchema.vertices);
    expect(result.schema?.edges).toEqual(expectedSchema.edges);
    expect(result.schema).toEqual(expectedSchema);
    expect(result).toEqual({
      ...config,
      connection: {
        ...config.connection,
        url: config.connection?.url ?? "",
        graphDbUrl: config.connection?.graphDbUrl ?? "",
      },
      schema: expectedSchema,
    });
  });
});

/** Sorts the configs by type name */
function byType(a: VertexTypeConfig, b: VertexTypeConfig) {
  return a.type.localeCompare(b.type);
}
