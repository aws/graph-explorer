import { useRecoilValue } from "recoil";
import useEntities from "./useEntities";
import { createVertexId, Edge, Entities, Schema, Vertex } from "@/core";
import {
  createRandomEdge,
  createRandomEntities,
  createRandomSchema,
  createRandomVertex,
} from "@/utils/testing";
import { schemaAtom } from "@/core/StateProvider/schema";
import { activeConfigurationAtom } from "@/core/StateProvider/configuration";
import { renderHookWithRecoilRoot } from "@/utils/testing";
import { waitForValueToChange } from "@/utils/testing/waitForValueToChange";
import { vi } from "vitest";
import { createRandomName } from "@shared/utils/testing";
import {
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  toNodeMap,
} from "@/core/StateProvider/nodes";
import {
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  toEdgeMap,
} from "@/core/StateProvider/edges";
import { cloneDeep } from "lodash";

describe("useEntities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should handle single node data correctly", async () => {
    const randomNode = createRandomVertex();
    const expectedRandomNodes = cloneDeep(randomNode);

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities();
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
  });

  it("should handle multiple nodes correctly", async () => {
    const node1: Vertex = {
      entityType: "vertex",
      id: createVertexId("1"),
      type: "type1",
      attributes: {},
    };
    const node2: Vertex = {
      entityType: "vertex",
      id: createVertexId("2"),
      type: "type2",
      attributes: {},
    };
    const node3: Vertex = {
      entityType: "vertex",
      id: createVertexId("3"),
      type: "type3",
      attributes: {},
    };
    const expectedNodes = toNodeMap([
      {
        entityType: "vertex",
        id: node1.id,
        type: node1.type,
        attributes: {},
      },
      {
        entityType: "vertex",
        id: node2.id,
        type: node2.type,
        attributes: {},
      },
      {
        entityType: "vertex",
        id: node3.id,
        type: node3.type,
        attributes: {},
      },
    ]);

    const { result } = renderHookWithRecoilRoot(() => {
      const [entities, setEntities] = useEntities();
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

    const actualNode2 = result.current.entities.nodes.get(node2.id);
    expect(actualNode2).not.toBeUndefined();
    expect(actualNode2?.id).toEqual(node2.id);
    expect(actualNode2?.type).toEqual(node2.type);

    const actualNode3 = result.current.entities.nodes.get(node3.id);
    expect(actualNode3).not.toBeUndefined();
    expect(actualNode3?.id).toEqual(node3.id);
    expect(actualNode3?.type).toEqual(node3.type);
  });

  it("should filter nodes by id", () => {
    const node1: Vertex = createRandomVertex();
    const node2: Vertex = createRandomVertex();
    const node3: Vertex = createRandomVertex();

    const { result } = renderHookWithRecoilRoot(
      () => {
        const [entities, setEntities] = useEntities();
        return { entities, setEntities };
      },
      snapshot => {
        snapshot.set(nodesAtom, toNodeMap([node1, node2, node3]));
        snapshot.set(nodesFilteredIdsAtom, new Set([node1.id, node2.id]));
      }
    );

    expect(result.current.entities).toEqual({
      nodes: toNodeMap([node3]),
      edges: new Map(),
    });
  });

  it("should filter nodes by type", () => {
    const node1: Vertex = createRandomVertex();
    const node2: Vertex = createRandomVertex();
    const node3: Vertex = createRandomVertex();

    const { result } = renderHookWithRecoilRoot(
      () => {
        const [entities, setEntities] = useEntities();
        return { entities, setEntities };
      },
      snapshot => {
        snapshot.set(nodesAtom, toNodeMap([node1, node2, node3]));
        snapshot.set(nodesTypesFilteredAtom, new Set([node1.type]));
      }
    );

    expect(result.current.entities).toEqual({
      nodes: toNodeMap([node2, node3]),
      edges: new Map(),
    });
  });

  it("should filter edges by id", () => {
    const node1: Vertex = createRandomVertex();
    const node2: Vertex = createRandomVertex();
    const edge1to2: Edge = createRandomEdge(node1, node2);
    const edge2to1: Edge = createRandomEdge(node2, node1);

    const { result } = renderHookWithRecoilRoot(
      () => {
        const [entities, setEntities] = useEntities();
        return { entities, setEntities };
      },
      snapshot => {
        snapshot.set(nodesAtom, toNodeMap([node1, node2]));
        snapshot.set(edgesAtom, toEdgeMap([edge1to2, edge2to1]));
        snapshot.set(edgesFilteredIdsAtom, new Set([edge1to2.id]));
      }
    );

    expect(result.current.entities).toEqual({
      nodes: toNodeMap([node1, node2]),
      edges: toEdgeMap([edge2to1]),
    });
  });

  it("should filter edges by type", () => {
    const node1: Vertex = createRandomVertex();
    const node2: Vertex = createRandomVertex();
    const edge1to2: Edge = createRandomEdge(node1, node2);
    const edge2to1: Edge = createRandomEdge(node2, node1);

    const { result } = renderHookWithRecoilRoot(
      () => {
        const [entities, setEntities] = useEntities();
        return { entities, setEntities };
      },
      snapshot => {
        snapshot.set(nodesAtom, toNodeMap([node1, node2]));
        snapshot.set(edgesAtom, toEdgeMap([edge1to2, edge2to1]));
        snapshot.set(edgesTypesFilteredAtom, new Set([edge1to2.type]));
      }
    );

    expect(result.current.entities).toEqual({
      nodes: toNodeMap([node1, node2]),
      edges: toEdgeMap([edge2to1]),
    });
  });

  it("should filter edges if either source or target is filtered", () => {
    const node1: Vertex = createRandomVertex();
    const node2: Vertex = createRandomVertex();
    const node3: Vertex = createRandomVertex();
    const edge1to2: Edge = createRandomEdge(node1, node2);
    const edge2to1: Edge = createRandomEdge(node2, node1);
    const edge2to3: Edge = createRandomEdge(node2, node3);

    const { result } = renderHookWithRecoilRoot(
      () => {
        const [entities, setEntities] = useEntities();
        return { entities, setEntities };
      },
      snapshot => {
        snapshot.set(nodesAtom, toNodeMap([node1, node2]));
        snapshot.set(edgesAtom, toEdgeMap([edge1to2, edge2to1, edge2to3]));
        snapshot.set(nodesFilteredIdsAtom, new Set([node1.id]));
      }
    );

    expect(result.current.entities).toEqual({
      nodes: toNodeMap([node2]),
      edges: toEdgeMap([edge2to3]),
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
