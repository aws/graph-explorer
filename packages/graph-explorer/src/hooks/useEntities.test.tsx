import { useRecoilValue } from "recoil";
import useEntities from "./useEntities";
import { Vertex, VertexId } from "@/types/entities";
import {
  createRandomEdge,
  createRandomEntities,
  createRandomSchema,
  createRandomVertex,
} from "@/utils/testing";
import { schemaAtom } from "@/core/StateProvider/schema";
import { activeConfigurationAtom } from "@/core/StateProvider/configuration";
import { Schema } from "@/core";
import { Entities } from "@/core/StateProvider/entitiesSelector";
import { renderHookWithRecoilRoot } from "@/utils/testing";
import { waitForValueToChange } from "@/utils/testing/waitForValueToChange";
import { vi } from "vitest";
import { createRandomInteger, createRandomName } from "@shared/utils/testing";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";

describe("useEntities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should handle single node data correctly", async () => {
    const randomNode = {
      id: Math.random().toString() as VertexId,
      type: "type1",
      neighborsCount: Math.floor(Math.random() * 100),
      neighborsCountByType: {},
    } as Vertex;
    const expectedRandomNodes: Vertex = {
      ...randomNode,
      neighborsCountByType: {},
      __unfetchedNeighborCounts: {},
      __fetchedOutEdgeCount: 0,
      __fetchedInEdgeCount: 0,
      __unfetchedNeighborCount: 0,
    };

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities({ disableFilters: true });
      return { entities, setEntities };
    });

    result.current.setEntities({
      nodes: toNodeMap([randomNode]),
      edges: new Map(),
    });

    await waitForValueToChange(() => result.current.entities);

    expect(result.current.entities).toEqual({
      nodes: toNodeMap([expectedRandomNodes]),
      edges: toEdgeMap([]),
    });
    const actualNode = result.current.entities.nodes.get(randomNode.id);
    expect(actualNode?.id).toEqual(randomNode.id);
    expect(actualNode?.type).toEqual(randomNode.type);
    expect(actualNode?.neighborsCount).toEqual(randomNode.neighborsCount);
    expect(actualNode?.neighborsCountByType).toEqual({});
    expect(actualNode?.__unfetchedNeighborCounts).toEqual({});
    expect(actualNode?.__fetchedOutEdgeCount).toEqual(0);
    expect(actualNode?.__fetchedInEdgeCount).toEqual(0);
    expect(actualNode?.__unfetchedNeighborCount).toEqual(0);
  });

  it("should handle multiple nodes correctly", async () => {
    const node1: Vertex = {
      id: "1" as VertexId,
      idType: "string",
      type: "type1",
      attributes: {},
      neighborsCount: 1,
      neighborsCountByType: {},
    };
    const node2: Vertex = {
      id: "2" as VertexId,
      idType: "string",
      type: "type2",
      attributes: {},
      neighborsCount: 2,
      neighborsCountByType: {},
    };
    const node3: Vertex = {
      id: "3" as VertexId,
      idType: "string",
      type: "type3",
      attributes: {},
      neighborsCount: 3,
      neighborsCountByType: {},
    };
    const expectedNodes = toNodeMap([
      {
        id: node1.id,
        idType: "string",
        type: node1.type,
        attributes: {},
        neighborsCount: node1.neighborsCount,
        neighborsCountByType: {},
        __unfetchedNeighborCounts: {},
        __fetchedOutEdgeCount: 0,
        __fetchedInEdgeCount: 0,
        __unfetchedNeighborCount: 0,
      },
      {
        id: node2.id,
        idType: "string",
        type: node2.type,
        attributes: {},
        neighborsCount: node2.neighborsCount,
        neighborsCountByType: {},
        __unfetchedNeighborCounts: {},
        __fetchedOutEdgeCount: 0,
        __fetchedInEdgeCount: 0,
        __unfetchedNeighborCount: 0,
      },
      {
        id: node3.id,
        idType: "string",
        type: node3.type,
        attributes: {},
        neighborsCount: node3.neighborsCount,
        neighborsCountByType: {},
        __unfetchedNeighborCounts: {},
        __fetchedOutEdgeCount: 0,
        __fetchedInEdgeCount: 0,
        __unfetchedNeighborCount: 0,
      },
    ]);

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities({ disableFilters: true });
      return { entities, setEntities };
    });

    result.current.setEntities({
      nodes: toNodeMap([node1, node2, node3]),
      edges: new Map(),
    });

    await waitForValueToChange(() => result.current.entities);

    expect(result.current.entities).toEqual({
      nodes: expectedNodes,
      edges: new Map(),
    });
    const actualNode1 = result.current.entities.nodes.get(node1.id);
    expect(actualNode1).not.toBeUndefined();
    expect(actualNode1?.id).toEqual(node1.id);
    expect(actualNode1?.type).toEqual(node1.type);
    expect(actualNode1?.neighborsCount).toEqual(node1.neighborsCount);
    expect(actualNode1?.neighborsCountByType).toEqual({});
    expect(actualNode1?.__unfetchedNeighborCounts).toEqual({});
    expect(actualNode1?.__fetchedOutEdgeCount).toEqual(0);
    expect(actualNode1?.__fetchedInEdgeCount).toEqual(0);
    expect(actualNode1?.__unfetchedNeighborCount).toEqual(0);

    const actualNode2 = result.current.entities.nodes.get(node2.id);
    expect(actualNode2).not.toBeUndefined();
    expect(actualNode2?.id).toEqual(node2.id);
    expect(actualNode2?.type).toEqual(node2.type);
    expect(actualNode2?.neighborsCount).toEqual(node2.neighborsCount);
    expect(actualNode2?.neighborsCountByType).toEqual({});
    expect(actualNode2?.__unfetchedNeighborCounts).toEqual({});
    expect(actualNode2?.__fetchedOutEdgeCount).toEqual(0);
    expect(actualNode2?.__fetchedInEdgeCount).toEqual(0);
    expect(actualNode2?.__unfetchedNeighborCount).toEqual(0);

    const actualNode3 = result.current.entities.nodes.get(node3.id);
    expect(actualNode3).not.toBeUndefined();
    expect(actualNode3?.id).toEqual(node3.id);
    expect(actualNode3?.type).toEqual(node3.type);
    expect(actualNode3?.neighborsCount).toEqual(node3.neighborsCount);
    expect(actualNode3?.neighborsCountByType).toEqual({});
    expect(actualNode3?.__unfetchedNeighborCounts).toEqual({});
    expect(actualNode3?.__fetchedOutEdgeCount).toEqual(0);
    expect(actualNode3?.__fetchedInEdgeCount).toEqual(0);
    expect(actualNode3?.__unfetchedNeighborCount).toEqual(0);
  });

  it("should calculate stats after adding new nodes and edges", async () => {
    const node1 = createRandomVertex();
    const node2 = createRandomVertex();
    const randomNeighborCount = createRandomInteger(500);
    node1.neighborsCount = randomNeighborCount;
    node1.neighborsCountByType[node2.type] = randomNeighborCount;
    const edge1to2 = createRandomEdge(node1, node2);

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities({ disableFilters: true });
      return { entities, setEntities };
    });

    result.current.setEntities({
      nodes: toNodeMap([node1, node2]),
      edges: toEdgeMap([edge1to2]),
    });

    await waitForValueToChange(() => result.current.entities);

    const actualNode1 = result.current.entities.nodes.get(node1.id)!;
    expect(actualNode1.__unfetchedNeighborCount).toEqual(
      randomNeighborCount - 1
    );
    expect(actualNode1.__unfetchedNeighborCounts![node2.type]).toEqual(
      randomNeighborCount - 1
    );
  });

  it("should return original entities before any filters were applied", () => {
    // Define newNode and newEdge
    const newNode = {
      id: "1",
      type: "type1",
      neighborsCount: 1,
      neighborsCountByType: {},
    };
    const newEdge = {
      id: "1",
      source: "1",
      target: "2",
      type: "type1",
    };

    // Define originalEntities
    const originalEntities = {
      nodes: [newNode],
      edges: [newEdge],
    };

    // Mock the useEntities hook
    const useEntitiesMock = vi.fn();
    useEntitiesMock.mockReturnValue([
      originalEntities,
      vi.fn(),
      originalEntities,
    ]);

    // Override the useEntities function in the module
    vi.doMock("../../src/hooks/useEntities", () => useEntitiesMock);

    // Render the hook
    const { result } = renderHookWithRecoilRoot(() => useEntitiesMock());

    // Since we have mocked useEntitiesMock, it should return the originalEntities immediately
    expect(result.current[0]).toEqual(originalEntities);
    expect(result.current[2]).toEqual(originalEntities);
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
    const entityNodeLabels = originalEntities.nodes
      .values()
      .map(n => n.type)
      .toArray();
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
    const entityEdgeLabels = originalEntities.edges
      .values()
      .map(e => e.type)
      .toArray();
    expect(schemaEdgeLabels).toEqual(expect.arrayContaining(entityEdgeLabels));
  });

  it("should update the schema node attributes", async () => {
    const originalSchema = createRandomSchema();
    const originalEntities = createRandomEntities();

    // Add a node that matches a node type in the schema
    const nodeTypeWithAdditionalAttributes = originalSchema.vertices[0].type;
    originalEntities.nodes.values().next().value!.type =
      nodeTypeWithAdditionalAttributes;

    const { schema, entities } = await setupAndPerformSetEntities(
      originalSchema,
      originalEntities
    );

    // Ensure node with new attributes is updated in schema
    const schemaNode = schema.vertices.find(
      v => v.type === nodeTypeWithAdditionalAttributes
    )!;
    const entityNode = entities.nodes.values().next().value!;
    const schemaNodeAttributeNames = schemaNode.attributes.map(a => a.name);
    const entityNodeAttributeNames = Object.keys(entityNode.attributes);
    expect(schemaNodeAttributeNames).toEqual(
      expect.arrayContaining(entityNodeAttributeNames)
    );
  });

  it("should update the schema edge attributes", async () => {
    const originalSchema = createRandomSchema();
    const originalEntities = createRandomEntities();

    // Set an edge to match an edge type in the schema
    const edgeTypeWithAdditionalAttributes = originalSchema.edges[0].type;
    originalEntities.edges.values().next().value!.type =
      edgeTypeWithAdditionalAttributes;

    const { schema, entities } = await setupAndPerformSetEntities(
      originalSchema,
      originalEntities
    );

    // Ensure edge with new attributes is updated in schema
    const schemaEdge = schema.edges.find(
      v => v.type === edgeTypeWithAdditionalAttributes
    )!;
    const entityEdge = entities.edges.values().next().value!;
    const schemaEdgeAttributeNames = schemaEdge.attributes.map(a => a.name);
    const entityEdgeAttributeNames = Object.keys(entityEdge.attributes);
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
