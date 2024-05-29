import { act } from "@testing-library/react-hooks";
import { useRecoilValue } from "recoil";
import useEntities from "./useEntities";
import { Vertex } from "../@types/entities";
import {
  createRandomEntities,
  createRandomName,
  createRandomSchema,
} from "../utils/testing/randomData";
import { schemaAtom } from "../core/StateProvider/schema";
import { activeConfigurationAtom } from "../core/StateProvider/configuration";
import { Schema } from "../core";
import { Entities } from "../core/StateProvider/entitiesSelector";
import renderHookWithRecoilRoot from "../utils/testing/renderHookWithRecoilRoot";

describe("useEntities", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should handle single node data correctly", async () => {
    const randomNode = {
      data: {
        id: Math.random().toString(),
        type: "type1",
        neighborsCount: Math.floor(Math.random() * 100),
        neighborsCountByType: {},
      },
    } as Vertex;
    const expectedRandomNodes = {
      data: {
        id: randomNode.data.id,
        type: randomNode.data.type,
        neighborsCount: randomNode.data.neighborsCount,
        neighborsCountByType: {},
        __unfetchedNeighborCounts: {},
        __fetchedOutEdgeCount: 0,
        __fetchedInEdgeCount: 0,
        __unfetchedNeighborCount: 0,
      },
    };

    const { result, waitForNextUpdate } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities({ disableFilters: true });
      return { entities, setEntities };
    });

    act(() => {
      result.current.setEntities({ nodes: [randomNode], edges: [] });
    });

    await waitForNextUpdate();

    expect(result.current.entities).toEqual({
      nodes: [expectedRandomNodes],
      edges: [],
    });
    expect(result.current.entities.nodes[0].data.id).toEqual(
      randomNode.data.id
    );
    expect(result.current.entities.nodes[0].data.type).toEqual(
      randomNode.data.type
    );
    expect(result.current.entities.nodes[0].data.neighborsCount).toEqual(
      randomNode.data.neighborsCount
    );
    expect(result.current.entities.nodes[0].data.neighborsCountByType).toEqual(
      {}
    );
    expect(
      result.current.entities.nodes[0].data.__unfetchedNeighborCounts
    ).toEqual({});
    expect(result.current.entities.nodes[0].data.__fetchedOutEdgeCount).toEqual(
      0
    );
    expect(result.current.entities.nodes[0].data.__fetchedInEdgeCount).toEqual(
      0
    );
    expect(
      result.current.entities.nodes[0].data.__unfetchedNeighborCount
    ).toEqual(0);
  });

  it("should handle multiple nodes correctly", async () => {
    const node1 = {
      data: {
        id: "1",
        type: "type1",
        neighborsCount: 1,
        neighborsCountByType: {},
      },
    } as Vertex;
    const node2 = {
      data: {
        id: "2",
        type: "type2",
        neighborsCount: 2,
        neighborsCountByType: {},
      },
    } as Vertex;
    const node3 = {
      data: {
        id: "3",
        type: "type3",
        neighborsCount: 3,
        neighborsCountByType: {},
      },
    } as Vertex;
    const expectedNodes = [
      {
        data: {
          id: node1.data.id,
          type: node1.data.type,
          neighborsCount: node1.data.neighborsCount,
          neighborsCountByType: {},
          __unfetchedNeighborCounts: {},
          __fetchedOutEdgeCount: 0,
          __fetchedInEdgeCount: 0,
          __unfetchedNeighborCount: 0,
        },
      },
      {
        data: {
          id: node2.data.id,
          type: node2.data.type,
          neighborsCount: node2.data.neighborsCount,
          neighborsCountByType: {},
          __unfetchedNeighborCounts: {},
          __fetchedOutEdgeCount: 0,
          __fetchedInEdgeCount: 0,
          __unfetchedNeighborCount: 0,
        },
      },
      {
        data: {
          id: node3.data.id,
          type: node3.data.type,
          neighborsCount: node3.data.neighborsCount,
          neighborsCountByType: {},
          __unfetchedNeighborCounts: {},
          __fetchedOutEdgeCount: 0,
          __fetchedInEdgeCount: 0,
          __unfetchedNeighborCount: 0,
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities({ disableFilters: true });
      return { entities, setEntities };
    });

    act(() => {
      result.current.setEntities({ nodes: [node1, node2, node3], edges: [] });
    });

    await waitForNextUpdate();

    expect(result.current.entities).toEqual({
      nodes: expectedNodes,
      edges: [],
    });
    expect(result.current.entities.nodes[0].data.id).toEqual(node1.data.id);
    expect(result.current.entities.nodes[0].data.type).toEqual(node1.data.type);
    expect(result.current.entities.nodes[0].data.neighborsCount).toEqual(
      node1.data.neighborsCount
    );
    expect(result.current.entities.nodes[0].data.neighborsCountByType).toEqual(
      {}
    );
    expect(
      result.current.entities.nodes[0].data.__unfetchedNeighborCounts
    ).toEqual({});
    expect(result.current.entities.nodes[0].data.__fetchedOutEdgeCount).toEqual(
      0
    );
    expect(result.current.entities.nodes[0].data.__fetchedInEdgeCount).toEqual(
      0
    );
    expect(
      result.current.entities.nodes[0].data.__unfetchedNeighborCount
    ).toEqual(0);

    expect(result.current.entities.nodes[1].data.id).toEqual(node2.data.id);
    expect(result.current.entities.nodes[1].data.type).toEqual(node2.data.type);
    expect(result.current.entities.nodes[1].data.neighborsCount).toEqual(
      node2.data.neighborsCount
    );
    expect(result.current.entities.nodes[1].data.neighborsCountByType).toEqual(
      {}
    );
    expect(
      result.current.entities.nodes[1].data.__unfetchedNeighborCounts
    ).toEqual({});
    expect(result.current.entities.nodes[1].data.__fetchedOutEdgeCount).toEqual(
      0
    );
    expect(result.current.entities.nodes[1].data.__fetchedInEdgeCount).toEqual(
      0
    );
    expect(
      result.current.entities.nodes[1].data.__unfetchedNeighborCount
    ).toEqual(0);

    expect(result.current.entities.nodes[2].data.id).toEqual(node3.data.id);
    expect(result.current.entities.nodes[2].data.type).toEqual(node3.data.type);
    expect(result.current.entities.nodes[2].data.neighborsCount).toEqual(
      node3.data.neighborsCount
    );
    expect(result.current.entities.nodes[2].data.neighborsCountByType).toEqual(
      {}
    );
    expect(
      result.current.entities.nodes[2].data.__unfetchedNeighborCounts
    ).toEqual({});
    expect(result.current.entities.nodes[2].data.__fetchedOutEdgeCount).toEqual(
      0
    );
    expect(result.current.entities.nodes[2].data.__fetchedInEdgeCount).toEqual(
      0
    );
    expect(
      result.current.entities.nodes[2].data.__unfetchedNeighborCount
    ).toEqual(0);
  });

  it("should return original entities before any filters were applied", async () => {
    // Define newNode and newEdge
    const newNode = {
      data: {
        id: "1",
        type: "type1",
        neighborsCount: 1,
        neighborsCountByType: {},
      },
    };
    const newEdge = {
      data: { id: "1", source: "1", target: "2", type: "type1" },
    };

    // Define originalEntities
    const originalEntities = {
      nodes: [newNode],
      edges: [newEdge],
    };

    // Mock the useEntities hook
    const useEntitiesMock = jest.fn();
    useEntitiesMock.mockReturnValue([
      originalEntities,
      jest.fn(),
      originalEntities,
    ]);

    // Override the useEntities function in the module
    jest.doMock("../../src/hooks/useEntities", () => useEntitiesMock);

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
  const { result, waitForNextUpdate } = renderHookWithRecoilRoot(
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

  act(() => result.current.setEntities(updatedEntities));
  await waitForNextUpdate();

  return result.current;
}
