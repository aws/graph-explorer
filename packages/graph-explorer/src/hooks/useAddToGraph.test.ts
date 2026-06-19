// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { act } from "react";

import {
  activeGraphSessionAtom,
  activeSchemaSelector,
  createEdgeConnection,
  createVertexType,
  edgesAtom,
  type EdgeTypeConfig,
  type GraphSessionStorageModel,
  mapEdgeToTypeConfig,
  mapVertexToTypeConfigs,
  nodesAtom,
  type VertexTypeConfig,
} from "@/core";
import {
  createRandomEdge,
  createRandomEntities,
  createRandomVertex,
  createRandomVertexForRdf,
  createTestableEdge,
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import { useAddToGraph } from "./useAddToGraph";

test("should add one node", async () => {
  const dbState = new DbState();

  const vertex = createRandomVertex();

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const actual = result.current.vertices.get(vertex.id);
    expect(actual).toStrictEqual(vertex);
  });
});

test("should add one edge", async () => {
  const dbState = new DbState();

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  // Add the nodes to the graph
  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  await waitFor(() => {
    const actual = result.current.edges.get(edge.id);
    expect(actual).toStrictEqual(edge);
  });
});

test("should add multiple nodes and edges", async () => {
  const dbState = new DbState();

  const randomEntities = createRandomEntities();

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback(randomEntities));

  const actualNodes = result.current.vertices.values().toArray();
  const expectedNodes = randomEntities.vertices;
  expect(actualNodes).toStrictEqual(expectedNodes);

  const actualEdges = result.current.edges.values().toArray();
  const expectedEdges = randomEntities.edges.values().toArray();
  expect(actualEdges).toStrictEqual(expectedEdges);
});

test("should add multiple nodes and edges ignoring duplicates", async () => {
  const dbState = new DbState();

  const randomEntities = createRandomEntities();

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() =>
    result.current.callback({
      vertices: [...randomEntities.vertices, ...randomEntities.vertices],
      edges: [...randomEntities.edges, ...randomEntities.edges],
    }),
  );

  const actualNodes = result.current.vertices.values().toArray();
  const expectedNodes = randomEntities.vertices;
  expect(actualNodes).toStrictEqual(expectedNodes);

  const actualEdges = result.current.edges.values().toArray();
  const expectedEdges = randomEntities.edges.values().toArray();
  expect(actualEdges).toStrictEqual(expectedEdges);
});

test("should update schema when adding a node", async () => {
  const dbState = new DbState();

  const vertex = createRandomVertex();
  const expectedVertexTypes = mapVertexToTypeConfigs(vertex);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  for (const expectedType of expectedVertexTypes) {
    const vtConfig = result.current.schema?.vertices.find(
      v => v.type === expectedType.type,
    );
    expect(vtConfig).toStrictEqual(expectedType);
  }
});

test("should update schema when adding a node with no label", async () => {
  const dbState = new DbState();

  const vertex = createRandomVertex();
  vertex.type = createVertexType("");
  vertex.types = [];
  const expectedVertexTypes = mapVertexToTypeConfigs(vertex);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  for (const expectedType of expectedVertexTypes) {
    const vtConfig = result.current.schema?.vertices.find(
      v => v.type === expectedType.type,
    );
    expect(vtConfig).toStrictEqual(expectedType);
  }
});

test("should update schema when adding an edge", async () => {
  const dbState = new DbState();

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);
  const expectedEdgeType = mapEdgeToTypeConfig(edge);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  const etConfig = result.current.schema?.edges.find(e => e.type === edge.type);
  expect(etConfig).toStrictEqual(expectedEdgeType);
});

test("should add missing attributes to the schema when adding a node", async () => {
  const dbState = new DbState();

  const vertex = createRandomVertex();
  const expectedVertexTypes = mapVertexToTypeConfigs(vertex);

  // Clear out the attributes in the initial schema
  for (const expectedType of expectedVertexTypes) {
    const initialVtConfig: VertexTypeConfig = {
      ...expectedType,
      attributes: [],
    };
    dbState.activeSchema.vertices.push(initialVtConfig);
  }

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  for (const expectedType of expectedVertexTypes) {
    const vtConfig = result.current.schema?.vertices.find(
      v => v.type === expectedType.type,
    );
    expect(vtConfig).toStrictEqual(expectedType);
  }
});

test("should add missing attributes to the schema when adding an edge", async () => {
  const dbState = new DbState();

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);
  const expectedEdgeType = mapEdgeToTypeConfig(edge);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  // Clear out the attributes in the initial schema
  const initialEtConfig: EdgeTypeConfig = {
    ...expectedEdgeType,
    attributes: [],
  };
  dbState.activeSchema.edges.push(initialEtConfig);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  const etConfig = result.current.schema?.edges.find(e => e.type === edge.type);
  expect(etConfig).toStrictEqual(expectedEdgeType);
});

test("should update graph storage when adding a node", async () => {
  const dbState = new DbState();

  const vertex = createRandomVertex();

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const graph = useAtomValue(activeGraphSessionAtom);
    return { callback, graph };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([vertex.id]),
    edges: new Set(),
  };

  expect(result.current.graph).toStrictEqual(expectedGraph);
});

test("should update graph storage when adding an edge", async () => {
  const dbState = new DbState();

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const graph = useAtomValue(activeGraphSessionAtom);
    return { callback, graph };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([node1.id, node2.id]),
    edges: new Set([edge.id]),
  };

  expect(result.current.graph).toStrictEqual(expectedGraph);
});

test("should infer edge connections when adding edges with vertices", async () => {
  const dbState = new DbState();
  dbState.activeSchema.edgeConnections = [];

  const source = createTestableVertex().with({ types: ["Person"] });
  const target = createTestableVertex().with({ types: ["Dog"] });
  const edge = createTestableEdge()
    .with({ type: "owner" })
    .withSource(source)
    .withTarget(target);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const schema = useAtomValue(activeSchemaSelector);
    return { callback, schema };
  }, dbState);

  await act(() =>
    result.current.callback({
      vertices: [source.asVertex(), target.asVertex()],
      edges: [edge.asEdge()],
    }),
  );

  expect(result.current.schema?.edgeConnections).toStrictEqual([
    createEdgeConnection({ source: "Person", edge: "owner", target: "Dog" }),
  ]);
});

test("should use batch vertex types over canvas vertex types for edge connections", async () => {
  const dbState = new DbState();
  dbState.activeSchema.edgeConnections = [];

  // Canvas has the source as "Employee"
  const canvasSource = createTestableVertex().with({ types: ["Employee"] });
  dbState.addVertexToGraph(canvasSource.asVertex());

  // Batch provides the same vertex as "Person" (should take priority)
  const batchSource = canvasSource.with({ types: ["Person"] });
  const target = createTestableVertex().with({ types: ["Dog"] });
  const edge = createTestableEdge()
    .with({ type: "owner" })
    .withSource(batchSource)
    .withTarget(target);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const schema = useAtomValue(activeSchemaSelector);
    return { callback, schema };
  }, dbState);

  await act(() =>
    result.current.callback({
      vertices: [batchSource.asVertex(), target.asVertex()],
      edges: [edge.asEdge()],
    }),
  );

  expect(result.current.schema?.edgeConnections).toStrictEqual([
    createEdgeConnection({ source: "Person", edge: "owner", target: "Dog" }),
  ]);
});

test("should resolve edge endpoints from canvas when not in batch", async () => {
  const dbState = new DbState();
  dbState.activeSchema.edgeConnections = [];

  // Source is already on the canvas
  const source = createTestableVertex().with({ types: ["Person"] });
  dbState.addVertexToGraph(source.asVertex());

  // Batch only has the target and the edge
  const target = createTestableVertex().with({ types: ["Dog"] });
  const edge = createTestableEdge()
    .with({ type: "owner" })
    .withSource(source)
    .withTarget(target);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const schema = useAtomValue(activeSchemaSelector);
    return { callback, schema };
  }, dbState);

  await act(() =>
    result.current.callback({
      vertices: [target.asVertex()],
      edges: [edge.asEdge()],
    }),
  );

  expect(result.current.schema?.edgeConnections).toStrictEqual([
    createEdgeConnection({ source: "Person", edge: "owner", target: "Dog" }),
  ]);
});

test("should ignore blank nodes when updating graph storage", async () => {
  const dbState = new DbState();

  const vertex = createRandomVertexForRdf();
  const blankNode = createRandomVertexForRdf();
  blankNode.isBlankNode = true;
  const edge = createRandomEdge(vertex, blankNode);

  const { result } = await renderHookWithState(() => {
    const callback = useAddToGraph();
    const graph = useAtomValue(activeGraphSessionAtom);
    return { callback, graph };
  }, dbState);

  await act(() =>
    result.current.callback({ vertices: [vertex, blankNode], edges: [edge] }),
  );

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([vertex.id]),
    edges: new Set(),
  };

  expect(result.current.graph).toStrictEqual(expectedGraph);
});
