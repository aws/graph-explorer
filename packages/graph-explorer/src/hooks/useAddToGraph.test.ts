import {
  createRandomEdge,
  createRandomEntities,
  createRandomVertex,
  createRandomVertexForRdf,
  DbState,
  FakeExplorer,
  makeFragment,
  renderHookWithState,
} from "@/utils/testing";
import { useAddToGraph } from "./useAddToGraph";
import { act } from "react";
import {
  activeGraphSessionAtom,
  activeSchemaSelector,
  edgesAtom,
  EdgeTypeConfig,
  extractConfigFromEntity,
  GraphSessionStorageModel,
  nodesAtom,
  VertexTypeConfig,
} from "@/core";
import { waitFor } from "@testing-library/react";
import { useAtomValue } from "jotai";

test("should add one node", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertex();
  explorer.addVertex(vertex);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const actual = result.current.vertices.get(vertex.id);
    expect(actual).toEqual(vertex);
  });
});

test("should materialize fragment vertices", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertex();

  explorer.addVertex(vertex);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() =>
    result.current.callback({ vertices: [makeFragment(vertex)] })
  );

  const actual = result.current.vertices.get(vertex.id);
  expect(actual).toEqual(vertex);
});

test("should materialize fragment edges", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const edge = createRandomEdge();

  explorer.addEdge(edge);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback({ edges: [makeFragment(edge)] }));

  const actual = result.current.edges.get(edge.id);
  expect(actual).toEqual(edge);
});

test("should add one edge", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  explorer.addEdge(edge);

  // Add the nodes to the graph
  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  await waitFor(() => {
    const actual = result.current.edges.get(edge.id);
    expect(actual).toEqual(edge);
  });
});

test("should add multiple nodes and edges", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const randomEntities = createRandomEntities();
  randomEntities.vertices.forEach(v => explorer.addVertex(v));
  randomEntities.edges.forEach(e => explorer.addEdge(e));

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() => result.current.callback(randomEntities));

  const actualNodes = result.current.vertices.values().toArray();
  const expectedNodes = randomEntities.vertices;
  expect(actualNodes).toEqual(expectedNodes);

  const actualEdges = result.current.edges.values().toArray();
  const expectedEdges = randomEntities.edges.values().toArray();
  expect(actualEdges).toEqual(expectedEdges);
});

test("should add multiple nodes and edges ignoring duplicates", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const randomEntities = createRandomEntities();
  randomEntities.vertices.forEach(v => explorer.addVertex(v));
  randomEntities.edges.forEach(e => explorer.addEdge(e));

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  }, dbState);

  await act(() =>
    result.current.callback({
      vertices: [...randomEntities.vertices, ...randomEntities.vertices],
      edges: [...randomEntities.edges, ...randomEntities.edges],
    })
  );

  const actualNodes = result.current.vertices.values().toArray();
  const expectedNodes = randomEntities.vertices;
  expect(actualNodes).toStrictEqual(expectedNodes);

  const actualEdges = result.current.edges.values().toArray();
  const expectedEdges = randomEntities.edges.values().toArray();
  expect(actualEdges).toStrictEqual(expectedEdges);
});

test("should update schema when adding a node", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertex();
  const expectedVertexType = extractConfigFromEntity(vertex);

  explorer.addVertex(vertex);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  const vtConfig = result.current.schema?.vertices.find(
    v => v.type === vertex.type
  );
  expect(vtConfig).toEqual(expectedVertexType);
});

test("should update schema when adding a node with no label", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertex();
  vertex.type = "";
  vertex.types = [];
  const expectedVertexType = extractConfigFromEntity(vertex);

  explorer.addVertex(vertex);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  const vtConfig = result.current.schema?.vertices.find(
    v => v.type === vertex.type
  );
  expect(vtConfig).toEqual(expectedVertexType);
});

test("should update schema when adding an edge", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);
  const expectedEdgeType = extractConfigFromEntity(edge);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  explorer.addVertex(node1);
  explorer.addVertex(node2);
  explorer.addEdge(edge);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  const etConfig = result.current.schema?.edges.find(e => e.type === edge.type);
  expect(etConfig).toEqual(expectedEdgeType);
});

test("should add missing attributes to the schema when adding a node", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertex();
  const expectedVertexType = extractConfigFromEntity(vertex);

  // Clear out the attributes in the initial schema
  const initialVtConfig: VertexTypeConfig = {
    ...expectedVertexType,
    attributes: [],
  };
  dbState.activeSchema.vertices.push(initialVtConfig);

  explorer.addVertex(vertex);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  const vtConfig = result.current.schema?.vertices.find(
    v => v.type === vertex.type
  );
  expect(vtConfig).toEqual(expectedVertexType);
});

test("should add missing attributes to the schema when adding an edge", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);
  const expectedEdgeType = extractConfigFromEntity(edge);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  // Clear out the attributes in the initial schema
  const initialEtConfig: EdgeTypeConfig = {
    ...expectedEdgeType,
    attributes: [],
  };
  dbState.activeSchema.edges.push(initialEtConfig);

  explorer.addVertex(node1);
  explorer.addVertex(node2);
  explorer.addEdge(edge);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);
    const schema = useAtomValue(activeSchemaSelector);

    return { callback, vertices, edges, schema };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  const etConfig = result.current.schema?.edges.find(e => e.type === edge.type);
  expect(etConfig).toEqual(expectedEdgeType);
});

test("should update graph storage when adding a node", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertex();

  explorer.addVertex(vertex);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const graph = useAtomValue(activeGraphSessionAtom);
    return { callback, graph };
  }, dbState);

  await act(() => result.current.callback({ vertices: [vertex] }));

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([vertex.id]),
    edges: new Set(),
  };

  expect(result.current.graph).toEqual(expectedGraph);
});

test("should update graph storage when adding an edge", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  explorer.addVertex(node1);
  explorer.addVertex(node2);
  explorer.addEdge(edge);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const graph = useAtomValue(activeGraphSessionAtom);
    return { callback, graph };
  }, dbState);

  await act(() => result.current.callback({ edges: [edge] }));

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([node1.id, node2.id]),
    edges: new Set([edge.id]),
  };

  expect(result.current.graph).toEqual(expectedGraph);
});

test("should ignore blank nodes when updating graph storage", async () => {
  const explorer = new FakeExplorer();
  const dbState = new DbState(explorer);

  const vertex = createRandomVertexForRdf();
  const blankNode = createRandomVertexForRdf();
  blankNode.isBlankNode = true;
  const edge = createRandomEdge(vertex, blankNode);

  explorer.addVertex(vertex);
  explorer.addVertex(blankNode);

  const { result } = renderHookWithState(() => {
    const callback = useAddToGraph();
    const graph = useAtomValue(activeGraphSessionAtom);
    return { callback, graph };
  }, dbState);

  await act(() =>
    result.current.callback({ vertices: [vertex, blankNode], edges: [edge] })
  );

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([vertex.id]),
    edges: new Set(),
  };

  expect(result.current.graph).toEqual(expectedGraph);
});
