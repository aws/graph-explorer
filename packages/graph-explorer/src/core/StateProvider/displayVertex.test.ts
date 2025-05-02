import {
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  createRandomVertexTypeConfig,
  JotaiSnapshot,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import {
  createVertexId,
  DisplayAttribute,
  getRawId,
  Schema,
  useDisplayVertexFromVertex,
  Vertex,
} from "@/core";
import { formatDate, sanitizeText } from "@/utils";
import { schemaAtom } from "./schema";
import {
  activeConfigurationAtom,
  configurationAtom,
  getDefaultVertexTypeConfig,
} from "./configuration";
import { createRandomDate } from "@shared/utils/testing";
import { MISSING_DISPLAY_VALUE } from "@/utils/constants";
import { mapToDisplayVertexTypeConfig } from "./displayTypeConfigs";
import { QueryEngine } from "@shared/types";

describe("useDisplayVertexFromVertex", () => {
  it("should keep the same ID", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).id).toEqual(vertex.id);
  });

  it("should be a vertex", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).entityType).toEqual("vertex");
  });

  it("should have a display ID equal to the vertex ID", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).displayId).toEqual(getRawId(vertex.id));
  });

  it("should have the display name be the sanitized vertex ID", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).displayName).toEqual(getRawId(vertex.id));
  });

  it("should have the display description be the sanitized vertex type", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).displayDescription).toEqual(sanitizeText(vertex.type));
  });

  it("should have the default type config when vertex type is not in the schema", () => {
    const vertex = createRandomVertex();
    const vtConfig = getDefaultVertexTypeConfig(vertex.type);
    const displayConfig = mapToDisplayVertexTypeConfig(vtConfig);
    expect(act(vertex).typeConfig).toEqual(displayConfig);
  });

  it("should use the type config from the merged schema", () => {
    const vertex = createRandomVertex();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    const schema = createRandomSchema();
    schema.vertices.push(vtConfig);

    const expectedTypeConfig = mapToDisplayVertexTypeConfig(vtConfig);

    expect(
      act(vertex, withSchemaAndConnection(schema, "gremlin")).typeConfig
    ).toEqual(expectedTypeConfig);
  });

  it("should have display types that list all types in gremlin", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();

    const vtConfig1 = createRandomVertexTypeConfig();
    delete vtConfig1.displayLabel;
    vtConfig1.type = vertex.type;
    schema.vertices.push(vtConfig1);

    const vtConfig2 = createRandomVertexTypeConfig();
    delete vtConfig2.displayLabel;
    schema.vertices.push(vtConfig2);

    vertex.types = [vtConfig1.type, vtConfig2.type];

    expect(
      act(vertex, withSchemaAndConnection(schema, "gremlin")).displayTypes
    ).toEqual(
      `${sanitizeText(vtConfig1.type)}, ${sanitizeText(vtConfig2.type)}`
    );
  });

  it("should have display types that list all types in sparql", () => {
    const vertex = createRandomVertex();
    vertex.type = "http://www.example.com/class#bar";
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example-class",
        uri: "http://www.example.com/class#",
      },
    ];

    const vtConfig1 = createRandomVertexTypeConfig();
    delete vtConfig1.displayLabel;
    vtConfig1.type = vertex.type;
    schema.vertices.push(vtConfig1);

    const vtConfig2 = createRandomVertexTypeConfig();
    vtConfig2.type = "http://www.example.com/class#baz";
    delete vtConfig2.displayLabel;
    schema.vertices.push(vtConfig2);

    vertex.types = [vtConfig1.type, vtConfig2.type];

    expect(
      act(vertex, withSchemaAndConnection(schema, "sparql")).displayTypes
    ).toEqual(`example-class:bar, example-class:baz`);
  });

  it("should have sorted attributes", () => {
    const vertex = createRandomVertex();
    const attributes: DisplayAttribute[] = Object.entries(vertex.attributes)
      .map(([key, value]) => ({
        name: key,
        displayLabel: sanitizeText(key),
        displayValue: String(value),
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(act(vertex).attributes).toEqual(attributes);
  });

  it("should format date values in attribute when type is Date", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    vtConfig.attributes.push({
      name: "created",
      displayLabel: sanitizeText("created"),
      dataType: "Date",
    });
    schema.vertices.push(vtConfig);

    vertex.attributes = {
      ...vertex.attributes,
      created: createRandomDate().toISOString(),
    };

    const actualAttribute = act(vertex, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toEqual(
      formatDate(new Date(vertex.attributes.created))
    );
  });

  it("should format date values in attribute when type is g:Date", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    vtConfig.attributes.push({
      name: "created",
      displayLabel: sanitizeText("created"),
      dataType: "g:Date",
    });
    schema.vertices.push(vtConfig);

    vertex.attributes = {
      ...vertex.attributes,
      created: createRandomDate().toISOString(),
    };

    const actualAttribute = act(vertex, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toEqual(
      formatDate(new Date(vertex.attributes.created))
    );
  });

  it("should include missing attributes with --- as value", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    schema.vertices.push(vtConfig);
    const configAttributeNames = vtConfig.attributes.map(attr => attr.name);

    const actualAttributesMatchingConfig = act(
      vertex,
      withSchema(schema)
    ).attributes.filter(a => configAttributeNames.includes(a.name));

    const expected = vtConfig.attributes
      .map(attr => ({
        name: attr.name,
        displayLabel: attr.displayLabel,
        displayValue: MISSING_DISPLAY_VALUE,
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(actualAttributesMatchingConfig).toEqual(expected);
  });

  it("should replace uri with prefixes when available", () => {
    const vertex = createRandomVertex();
    vertex.id = createVertexId("http://www.example.com/resources#foo");
    vertex.type = "http://www.example.com/class#bar";
    vertex.types = ["http://www.example.com/class#bar"];
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example",
        uri: "http://www.example.com/resources#",
      },
      {
        prefix: "example-class",
        uri: "http://www.example.com/class#",
      },
    ];

    const displayVertex = act(
      vertex,
      withSchemaAndConnection(schema, "sparql")
    );
    expect(displayVertex.displayId).toEqual("example:foo");
    expect(displayVertex.displayTypes).toEqual("example-class:bar");
  });

  // Helpers

  function act(
    vertex: Vertex,
    initializeState?: (mutableSnapshot: JotaiSnapshot) => void
  ) {
    const { result } = renderHookWithRecoilRoot(
      () => useDisplayVertexFromVertex(vertex),
      initializeState
    );
    return result.current;
  }

  function withSchema(schema: Schema) {
    const config = createRandomRawConfiguration();
    return (snapshot: JotaiSnapshot) => {
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(schema: Schema, queryEngine: QueryEngine) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return (snapshot: JotaiSnapshot) => {
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(activeConfigurationAtom, config.id);
    };
  }
});
