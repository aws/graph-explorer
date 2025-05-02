import {
  createRandomEdge,
  createRandomEntities,
  createRandomVertex,
  createRandomVertexForRdf,
  DbState,
  renderHookWithRecoilRoot,
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
  toNodeMap,
  VertexTypeConfig,
} from "@/core";
import { waitFor } from "@testing-library/react";
import { useMaterializeVertices } from "./useMaterializeVertices";
import { cloneDeep } from "lodash";
import { useAtomValue } from "jotai";

vi.mock("./useMaterializeVertices", () => ({
  useMaterializeVertices: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

test("should add one node", async () => {
  const vertex = createRandomVertex();

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([vertex]))
  );

  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  });

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const actual = result.current.vertices.get(vertex.id);
    expect(actual).toEqual(vertex);
  });
});

test("should materialize fragment vertices", async () => {
  const vertex = createRandomVertex();
  const clonedVertex = cloneDeep(vertex);
  vertex.__isFragment = true;
  vertex.attributes = {};

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([clonedVertex]))
  );

  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  });

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const actual = result.current.vertices.get(vertex.id);
    expect(actual).toEqual(clonedVertex);
  });
});

test("should add one edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([node1, node2]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useAtomValue(nodesAtom);
      const edges = useAtomValue(edgesAtom);

      return { callback, vertices, edges };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
    }
  );

  await act(() => result.current.callback({ edges: [edge] }));

  await waitFor(() => {
    const actual = result.current.edges.get(edge.id);
    expect(actual).toEqual(edge);
  });
});

test("should add multiple nodes and edges", async () => {
  const randomEntities = createRandomEntities();

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(randomEntities.nodes)
  );

  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph();
    const vertices = useAtomValue(nodesAtom);
    const edges = useAtomValue(edgesAtom);

    return { callback, vertices, edges };
  });

  await act(() =>
    result.current.callback({
      vertices: [...randomEntities.nodes.values()],
      edges: [...randomEntities.edges.values()],
    })
  );

  await waitFor(() => {
    const actualNodes = result.current.vertices.values().toArray();
    const expectedNodes = randomEntities.nodes.values().toArray();
    expect(actualNodes).toEqual(expectedNodes);

    const actualEdges = result.current.edges.values().toArray();
    const expectedEdges = randomEntities.edges.values().toArray();
    expect(actualEdges).toEqual(expectedEdges);
  });
});

test("should update schema when adding a node", async () => {
  const vertex = createRandomVertex();
  const expectedVertexType = extractConfigFromEntity(vertex);
  const dbState = new DbState();

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([vertex]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useAtomValue(nodesAtom);
      const edges = useAtomValue(edgesAtom);
      const schema = useAtomValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const vtConfig = result.current.schema?.vertices.find(
      v => v.type === vertex.type
    );
    expect(vtConfig).toEqual(expectedVertexType);
  });
});

test("should update schema when adding a node with no label", async () => {
  const vertex = createRandomVertex();
  vertex.type = "";
  vertex.types = [];
  const expectedVertexType = extractConfigFromEntity(vertex);
  const dbState = new DbState();

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([vertex]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useAtomValue(nodesAtom);
      const edges = useAtomValue(edgesAtom);
      const schema = useAtomValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const vtConfig = result.current.schema?.vertices.find(
      v => v.type === vertex.type
    );
    expect(vtConfig).toEqual(expectedVertexType);
  });
});

test("should update schema when adding an edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);
  const expectedEdgeType = extractConfigFromEntity(edge);
  const dbState = new DbState();
  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([node1, node2]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useAtomValue(nodesAtom);
      const edges = useAtomValue(edgesAtom);
      const schema = useAtomValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ edges: [edge] }));

  await waitFor(() => {
    const etConfig = result.current.schema?.edges.find(
      e => e.type === edge.type
    );
    expect(etConfig).toEqual(expectedEdgeType);
  });
});

test("should add missing attributes to the schema when adding a node", async () => {
  const vertex = createRandomVertex();
  const expectedVertexType = extractConfigFromEntity(vertex);
  const dbState = new DbState();

  // Clear out the attributes in the initial schema
  const initialVtConfig: VertexTypeConfig = {
    ...expectedVertexType,
    attributes: [],
  };
  dbState.activeSchema.vertices.push(initialVtConfig);

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([vertex]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useAtomValue(nodesAtom);
      const edges = useAtomValue(edgesAtom);
      const schema = useAtomValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ vertices: [vertex] }));

  await waitFor(() => {
    const vtConfig = result.current.schema?.vertices.find(
      v => v.type === vertex.type
    );
    expect(vtConfig).toEqual(expectedVertexType);
  });
});

test("should add missing attributes to the schema when adding an edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);
  const expectedEdgeType = extractConfigFromEntity(edge);
  const dbState = new DbState();
  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  // Clear out the attributes in the initial schema
  const initialEtConfig: EdgeTypeConfig = {
    ...expectedEdgeType,
    attributes: [],
  };
  dbState.activeSchema.edges.push(initialEtConfig);

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([node1, node2]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useAtomValue(nodesAtom);
      const edges = useAtomValue(edgesAtom);
      const schema = useAtomValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ edges: [edge] }));

  await waitFor(() => {
    const etConfig = result.current.schema?.edges.find(
      e => e.type === edge.type
    );
    expect(etConfig).toEqual(expectedEdgeType);
  });
});

test("should update graph storage when adding a node", async () => {
  const vertex = createRandomVertex();
  const dbState = new DbState();

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([vertex]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const graph = useAtomValue(activeGraphSessionAtom);
      return { callback, graph };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ vertices: [vertex] }));

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([vertex.id]),
    edges: new Set(),
  };

  await waitFor(() => {
    expect(result.current.graph).toEqual(expectedGraph);
  });
});

test("should update graph storage when adding an edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  const dbState = new DbState();
  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([node1, node2]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const graph = useAtomValue(activeGraphSessionAtom);
      return { callback, graph };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() => result.current.callback({ edges: [edge] }));

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([node1.id, node2.id]),
    edges: new Set([edge.id]),
  };

  await waitFor(() => {
    expect(result.current.graph).toEqual(expectedGraph);
  });
});

test("should ignore blank nodes when updating graph storage", async () => {
  const vertex = createRandomVertexForRdf();
  const blankNode = createRandomVertexForRdf();
  blankNode.__isBlank = true;
  const edge = createRandomEdge(vertex, blankNode);

  const dbState = new DbState();

  vi.mocked(useMaterializeVertices).mockReturnValue(() =>
    Promise.resolve(toNodeMap([vertex, blankNode]))
  );

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const graph = useAtomValue(activeGraphSessionAtom);
      return { callback, graph };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  await act(() =>
    result.current.callback({ vertices: [vertex, blankNode], edges: [edge] })
  );

  const expectedGraph: GraphSessionStorageModel = {
    vertices: new Set([vertex.id]),
    edges: new Set(),
  };

  await waitFor(() => {
    expect(result.current.graph).toEqual(expectedGraph);
  });
});
