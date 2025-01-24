import { Edge } from "@/core";
import {
  createRandomEdge,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { useDisplayEdgeFromEdge } from "./displayEdge";
import { formatDate, sanitizeText } from "@/utils";
import { createRandomDate } from "@shared/utils/testing";
import { DisplayAttribute } from "./displayAttribute";
import { mapToDisplayEdgeTypeConfig } from "./displayTypeConfigs";
import {
  activeConfigurationAtom,
  configurationAtom,
  getDefaultEdgeTypeConfig,
} from "./configuration";
import { Schema } from "../ConfigurationProvider";
import { MutableSnapshot } from "recoil";
import { schemaAtom } from "./schema";
import { QueryEngine } from "@shared/types";
import { getRawId } from "@/core";

describe("useDisplayEdgeFromEdge", () => {
  it("should keep the same ID", () => {
    const edge = createEdge();
    expect(act(edge).id).toEqual(edge.id);
  });

  it("should be an edge", () => {
    const edge = createEdge();
    expect(act(edge).entityType).toEqual("edge");
  });

  it("should have a display ID equal to the edge ID", () => {
    const edge = createEdge();
    expect(act(edge).displayId).toEqual(getRawId(edge.id));
  });

  it("should have the display name be the types", () => {
    const edge = createEdge();
    expect(act(edge).displayName).toEqual(sanitizeText(edge.type));
  });

  it("should have display name that matches the attribute value", () => {
    const edge = createEdge();
    const schema = createRandomSchema();
    // Get the first attribute
    const attribute = Object.entries(edge.attributes).map(([name, value]) => ({
      name,
      value,
    }))[0];

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayNameAttribute = attribute.name;
    schema.edges.push(etConfig);

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayName
    ).toEqual(`${attribute.value}`);
  });

  it("should have display name that matches the types when displayNameAttribute is 'type'", () => {
    const edge = createEdge();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    delete etConfig.displayLabel;
    etConfig.type = edge.type;
    etConfig.displayNameAttribute = "type";
    schema.edges.push(etConfig);

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayName
    ).toEqual(sanitizeText(edge.type));
  });

  it("should have the default type config when edge type is not in the schema", () => {
    const edge = createEdge();
    const etConfig = getDefaultEdgeTypeConfig(edge.type);
    const displayConfig = mapToDisplayEdgeTypeConfig(etConfig);
    expect(act(edge).typeConfig).toEqual(displayConfig);
  });

  it("should use the type config from the merged schema", () => {
    const edge = createEdge();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    const schema = createRandomSchema();
    schema.edges.push(etConfig);

    const expectedTypeConfig = mapToDisplayEdgeTypeConfig(etConfig);

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).typeConfig
    ).toEqual(expectedTypeConfig);
  });

  it("should have display types that list all types in gremlin", () => {
    const edge = createEdge();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    delete etConfig.displayLabel;
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayTypes
    ).toEqual(`${sanitizeText(etConfig.type)}`);
  });

  it("should have display types that list all types in sparql", () => {
    const edge = createEdge();
    edge.type = "http://www.example.com/class#bar";
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example-class",
        uri: "http://www.example.com/class#",
      },
    ];

    const etConfig = createRandomEdgeTypeConfig();
    delete etConfig.displayLabel;
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      act(edge, withSchemaAndConnection(schema, "sparql")).displayTypes
    ).toEqual(`example-class:bar`);
  });

  it("should have sorted attributes", () => {
    const edge = createEdge();
    const attributes: DisplayAttribute[] = Object.entries(edge.attributes)
      .map(([key, value]) => ({
        name: key,
        displayLabel: sanitizeText(key),
        displayValue: String(value),
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(act(edge).attributes).toEqual(attributes);
  });

  it("should format date values in attribute when type is Date", () => {
    const edge = createEdge();
    const schema = createRandomSchema();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.attributes.push({
      name: "created",
      displayLabel: sanitizeText("created"),
      dataType: "Date",
    });
    schema.edges.push(etConfig);

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate().toISOString(),
    };

    const actualAttribute = act(edge, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toEqual(
      formatDate(new Date(edge.attributes.created))
    );
  });

  it("should format date values in attribute when type is g:Date", () => {
    const edge = createEdge();
    const schema = createRandomSchema();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.attributes.push({
      name: "created",
      displayLabel: sanitizeText("created"),
      dataType: "g:Date",
    });
    schema.edges.push(etConfig);

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate().toISOString(),
    };

    const actualAttribute = act(edge, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toEqual(
      formatDate(new Date(edge.attributes.created))
    );
  });

  // Helpers

  function createEdge() {
    return createRandomEdge(createRandomVertex(), createRandomVertex());
  }

  function act(
    edge: Edge,
    initializeState?: (mutableSnapshot: MutableSnapshot) => void
  ) {
    const { result } = renderHookWithRecoilRoot(
      () => useDisplayEdgeFromEdge(edge),
      initializeState
    );
    return result.current;
  }

  function withSchema(schema: Schema) {
    const config = createRandomRawConfiguration();
    return (snapshot: MutableSnapshot) => {
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(schema: Schema, queryEngine: QueryEngine) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return (snapshot: MutableSnapshot) => {
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(activeConfigurationAtom, config.id);
    };
  }
});
