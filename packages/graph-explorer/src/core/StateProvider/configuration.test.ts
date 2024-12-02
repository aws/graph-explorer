import {
  createRandomEdgePreferences,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexPreferences,
  createRandomVertexTypeConfig,
} from "@/utils/testing";
import { mergeConfiguration } from "./configuration";
import { RawConfiguration, VertexTypeConfig } from "../ConfigurationProvider";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";
import { SchemaInference } from "./schema";
import { UserStyling } from "./userPreferences";
import { sanitizeText } from "@/utils";
import { RESERVED_ID_PROPERTY } from "@/utils/constants";
import { createRandomName } from "@shared/utils/testing";

const defaultVertexStyle = {
  color: "#128EE5",
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
  displayNameAttribute: RESERVED_ID_PROPERTY,
  longDisplayNameAttribute: "types",
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
          displayLabel: sanitizeText(e.type),
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
          displayLabel: sanitizeText(e.type),
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

  it("should use vertex type as display label when no display label is provided", () => {
    const config: RawConfiguration = createRandomRawConfiguration();
    delete config.schema;
    const styling: UserStyling = {};
    const schema = createRandomSchema();

    const vtConfig = createRandomVertexTypeConfig();
    delete vtConfig.displayLabel;
    schema.vertices = [vtConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualVtConfig = result.schema?.vertices.find(
      v => v.type === vtConfig.type
    );

    expect(actualVtConfig?.displayLabel).toEqual(sanitizeText(vtConfig.type));
  });

  it("should use edge type as display label when no display label is provided", () => {
    const config: RawConfiguration = createRandomRawConfiguration();
    delete config.schema;
    const styling: UserStyling = {};
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    delete etConfig.displayLabel;
    schema.edges = [etConfig];

    const result = mergeConfiguration(schema, config, styling);

    const actualEtConfig = result.schema?.edges.find(
      e => e.type === etConfig.type
    );

    expect(actualEtConfig?.displayLabel).toEqual(sanitizeText(etConfig.type));
  });

  it("should prefer vertex styling display label", () => {
    const vtConfig = createRandomVertexTypeConfig();
    delete vtConfig.displayLabel;

    const customDisplayLabel = createRandomName("Display Label");

    const config: RawConfiguration = createRandomRawConfiguration();
    delete config.schema;
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
    delete etConfig.displayLabel;

    const customDisplayLabel = createRandomName("Display Label");

    const config: RawConfiguration = createRandomRawConfiguration();
    delete config.schema;
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
});

/** Sorts the configs by type name */
function byType(a: VertexTypeConfig, b: VertexTypeConfig) {
  return a.type.localeCompare(b.type);
}
