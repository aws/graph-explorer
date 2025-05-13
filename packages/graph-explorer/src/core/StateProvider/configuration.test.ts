import {
  createRandomEdgePreferences,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexPreferences,
  createRandomVertexTypeConfig,
} from "@/utils/testing";
import {
  defaultEdgeTypeConfig,
  defaultVertexTypeConfig,
  mergeConfiguration,
  NormalizedConnection,
} from "./configuration";
import { RawConfiguration, VertexTypeConfig } from "../ConfigurationProvider";
import { SchemaInference } from "./schema";
import { UserStyling } from "./userPreferences";
import { createRandomName } from "@shared/utils/testing";
import { RESERVED_TYPES_PROPERTY } from "@/utils";

/** The default empty connection values when no value is provided. */
const defaultEmptyConnection: NormalizedConnection = {
  url: "",
  graphDbUrl: "",
  queryEngine: "gremlin",
  proxyConnection: false,
  awsAuthEnabled: false,
};

describe("mergedConfiguration", () => {
  it("should produce empty defaults when empty object is passed", () => {
    const config = {} as RawConfiguration;
    const result = mergeConfiguration(null, config, {});

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
    const result = mergeConfiguration(null, config, {});

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
          ...defaultVertexTypeConfig,
          ...v,
        }))
        .toSorted(byType),
      edges: schema.edges.map(e => {
        return {
          ...defaultEdgeTypeConfig,
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
        ...defaultEmptyConnection,
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
            ...defaultVertexTypeConfig,
            ...v,
            ...style,
          };
        })
        .toSorted(byType),
      edges: schema.edges.map(e => {
        const style = styling.edges?.find(s => s.type === e.type) ?? {};
        return {
          ...defaultEdgeTypeConfig,
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
        ...defaultEmptyConnection,
        ...config.connection,
        url: config.connection?.url ?? "",
        graphDbUrl: config.connection?.graphDbUrl ?? "",
      },
      schema: expectedSchema,
    });
  });

  it("should have undefined vertex display label when not provided", () => {
    const config = createRandomRawConfiguration();
    const styling: UserStyling = {};
    const schema = createRandomSchema();

    const vtConfig = createRandomVertexTypeConfig();
    delete vtConfig.displayLabel;
    schema.vertices = [vtConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualVtConfig = result.schema?.vertices.find(
      v => v.type === vtConfig.type
    );

    expect(actualVtConfig?.displayLabel).toBeUndefined();
  });

  it("should have undefined edge display label when not provided", () => {
    const config: RawConfiguration = createRandomRawConfiguration();
    const styling: UserStyling = {};
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    delete etConfig.displayLabel;
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type
    );

    expect(actualEtConfig?.displayLabel).toBeUndefined();
  });

  it("should prefer vertex styling display label", () => {
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.displayLabel = createRandomName("displayLabel");

    const customDisplayLabel = createRandomName("Display Label");

    const config: RawConfiguration = createRandomRawConfiguration();
    const styling: UserStyling = {
      vertices: [
        {
          type: vtConfig.type,
          displayLabel: customDisplayLabel,
        },
      ],
    };
    const schema = createRandomSchema();
    schema.vertices = [vtConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualVtConfig = result.schema?.vertices.find(
      v => v.type === vtConfig.type
    );

    expect(actualVtConfig?.displayLabel).toEqual(customDisplayLabel);
  });

  it("should prefer edge styling display label", () => {
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.displayLabel = createRandomName("displayLabel");

    const customDisplayLabel = createRandomName("Display Label");

    const config: RawConfiguration = createRandomRawConfiguration();
    const styling: UserStyling = {
      edges: [
        {
          type: etConfig.type,
          displayLabel: customDisplayLabel,
        },
      ],
    };
    const schema = createRandomSchema();
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type
    );

    expect(actualEtConfig?.displayLabel).toEqual(customDisplayLabel);
  });

  it("should patch displayNameAttribute to be 'types' when it was 'type'", () => {
    const etConfig = createRandomEdgeTypeConfig();

    const config: RawConfiguration = createRandomRawConfiguration();
    const styling: UserStyling = {
      edges: [
        {
          type: etConfig.type,
          displayNameAttribute: "type",
        },
      ],
    };
    const schema = createRandomSchema();
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type
    );

    expect(actualEtConfig?.displayNameAttribute).toEqual(
      RESERVED_TYPES_PROPERTY
    );
  });
});

/** Sorts the configs by type name */
function byType(a: VertexTypeConfig, b: VertexTypeConfig) {
  return a.type.localeCompare(b.type);
}
