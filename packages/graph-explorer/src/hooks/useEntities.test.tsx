import { useRecoilValue } from "recoil";
import useEntities from "./useEntities";
import { Vertex } from "../@types/entities";
import {
  createArray,
  createRandomEntities,
  createRandomName,
  createRandomSchema,
  createRandomVertex,
} from "../utils/testing/randomData";
import { schemaAtom } from "../core/StateProvider/schema";
import { activeConfigurationAtom } from "../core/StateProvider/configuration";
import { Schema } from "../core";
import { Entities } from "../core/StateProvider/entitiesSelector";
import renderHookWithRecoilRoot from "../utils/testing/renderHookWithRecoilRoot";
import { waitForValueToChange } from "../utils/testing/waitForValueToChange";
import { cloneDeep } from "lodash";

describe("useEntities", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should handle single node data correctly", async () => {
    const randomNode: Vertex = createRandomVertex();
    const expectedRandomNodes: Vertex = cloneDeep(randomNode);

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities();
      return { entities, setEntities };
    });

    result.current.setEntities({ nodes: [randomNode], edges: [] });

    await waitForValueToChange(() => result.current.entities);

    expect(result.current.entities).toEqual({
      nodes: [expectedRandomNodes],
      edges: [],
    });
  });

  it("should handle multiple nodes correctly", async () => {
    const nodes = createArray(3, createRandomVertex);
    const expectedNodes = cloneDeep(nodes);

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities();
      return { entities, setEntities };
    });

    result.current.setEntities({ nodes, edges: [] });

    await waitForValueToChange(() => result.current.entities);

    expect(result.current.entities).toEqual({
      nodes: expectedNodes,
      edges: [],
    });
  });

  it("should update the schema with new node types", async () => {
    const originalSchema = createRandomSchema();
    const originalEntities = createRandomEntities();

    const { schema } = await setupAndPerformSetEntities(
      originalSchema,
      originalEntities
    );

    // Ensure new node types are added to the schema
    const schemaNodeLabels = schema.vertices.map(v => v.type);
    const entityNodeLabels = originalEntities.nodes.map(n => n.data.type);
    expect(schemaNodeLabels).toEqual(expect.arrayContaining(entityNodeLabels));
  });

  it("should update the schema with new edge types", async () => {
    const originalSchema = createRandomSchema();
    const originalEntities = createRandomEntities();

    const { schema } = await setupAndPerformSetEntities(
      originalSchema,
      originalEntities
    );

    // Ensure new edge types are added to the schema
    const schemaEdgeLabels = schema.edges.map(e => e.type);
    const entityEdgeLabels = originalEntities.edges.map(e => e.data.type);
    expect(schemaEdgeLabels).toEqual(expect.arrayContaining(entityEdgeLabels));
  });

  it("should update the schema node attributes", async () => {
    const originalSchema = createRandomSchema();
    const originalEntities = createRandomEntities();

    // Add a node that matches a node type in the schema
    const nodeTypeWithAdditionalAttributes = originalSchema.vertices[0].type;
    originalEntities.nodes[0].data.type = nodeTypeWithAdditionalAttributes;

    const { schema, entities } = await setupAndPerformSetEntities(
      originalSchema,
      originalEntities
    );

    // Ensure node with new attributes is updated in schema
    const schemaNode = schema.vertices.find(
      v => v.type === nodeTypeWithAdditionalAttributes
    )!;
    const entityNode = entities.nodes[0];
    const schemaNodeAttributeNames = schemaNode.attributes.map(a => a.name);
    const entityNodeAttributeNames = Object.keys(entityNode.data.attributes);
    expect(schemaNodeAttributeNames).toEqual(
      expect.arrayContaining(entityNodeAttributeNames)
    );
  });

  it("should update the schema edge attributes", async () => {
    const originalSchema = createRandomSchema();
    const originalEntities = createRandomEntities();

    // Set an edge to match an edge type in the schema
    const edgeTypeWithAdditionalAttributes = originalSchema.edges[0].type;
    originalEntities.edges[0].data.type = edgeTypeWithAdditionalAttributes;

    const { schema, entities } = await setupAndPerformSetEntities(
      originalSchema,
      originalEntities
    );

    // Ensure edge with new attributes is updated in schema
    const schemaEdge = schema.edges.find(
      v => v.type === edgeTypeWithAdditionalAttributes
    )!;
    const entityEdge = entities.edges[0];
    const schemaEdgeAttributeNames = schemaEdge.attributes.map(a => a.name);
    const entityEdgeAttributeNames = Object.keys(entityEdge.data.attributes);
    expect(schemaEdgeAttributeNames).toEqual(
      expect.arrayContaining(entityEdgeAttributeNames)
    );
  });
});

/**
 * Sets up the initial schema in Recoil and performs the setEntities() call
 * with the given entities.
 *
 * @param initialSchema The schema to set in Recoil initially
 * @param updatedEntities The entities to pass to setEntities()
 * @returns The updated schema and entities, and setEntities hook
 */
async function setupAndPerformSetEntities(
  initialSchema: Schema,
  updatedEntities: Entities
) {
  const configId = createRandomName("configId");
  const { result } = renderHookWithRecoilRoot(
    () => {
      const [entities, setEntities] = useEntities();
      const schemas = useRecoilValue(schemaAtom);
      const schema = schemas.get(configId)!;

      return {
        entities,
        setEntities,
        schema,
      };
    },
    snapshot => {
      snapshot.set(schemaAtom, new Map([[configId, initialSchema]]));
      snapshot.set(activeConfigurationAtom, configId);
    }
  );

  result.current.setEntities(updatedEntities);

  await waitForValueToChange(() => result.current.entities);

  return result.current;
}
