import {
  createRandomEdge,
  createRandomEntities,
  createRandomVertex,
  DbState,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { useAddToGraph } from "./useAddToGraph";
import { act } from "react";
import { nodesAtom, toNodeMap } from "@/core/StateProvider/nodes";
import { useRecoilValue } from "recoil";
import { edgesAtom, EdgeTypeConfig, VertexTypeConfig } from "@/core";
import { waitFor } from "@testing-library/react";
import {
  activeSchemaSelector,
  extractConfigFromEntity,
} from "@/core/StateProvider/schema";

test("should add one node", async () => {
  const vertex = createRandomVertex();

  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph();
    const vertices = useRecoilValue(nodesAtom);
    const edges = useRecoilValue(edgesAtom);

    return { callback, vertices, edges };
  });

  act(() => {
    result.current.callback({ vertices: [vertex] });
  });

  await waitFor(() => {
    const actual = result.current.vertices.get(vertex.id);
    expect(actual).toEqual(vertex);
  });
});

test("should add one edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge = createRandomEdge(node1, node2);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useRecoilValue(nodesAtom);
      const edges = useRecoilValue(edgesAtom);

      return { callback, vertices, edges };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
    }
  );

  act(() => {
    result.current.callback({ edges: [edge] });
  });

  await waitFor(() => {
    const actual = result.current.edges.get(edge.id);
    expect(actual).toEqual(edge);
  });
});

test("should add multiple nodes and edges", async () => {
  const randomEntities = createRandomEntities();

  const { result } = renderHookWithRecoilRoot(() => {
    const callback = useAddToGraph();
    const vertices = useRecoilValue(nodesAtom);
    const edges = useRecoilValue(edgesAtom);

    return { callback, vertices, edges };
  });

  act(() => {
    result.current.callback({
      vertices: [...randomEntities.nodes.values()],
      edges: [...randomEntities.edges.values()],
    });
  });

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

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useRecoilValue(nodesAtom);
      const edges = useRecoilValue(edgesAtom);
      const schema = useRecoilValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  act(() => {
    result.current.callback({ vertices: [vertex] });
  });

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

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useRecoilValue(nodesAtom);
      const edges = useRecoilValue(edgesAtom);
      const schema = useRecoilValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  act(() => {
    result.current.callback({ edges: [edge] });
  });

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

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useRecoilValue(nodesAtom);
      const edges = useRecoilValue(edgesAtom);
      const schema = useRecoilValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  act(() => {
    result.current.callback({ vertices: [vertex] });
  });

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

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useAddToGraph();
      const vertices = useRecoilValue(nodesAtom);
      const edges = useRecoilValue(edgesAtom);
      const schema = useRecoilValue(activeSchemaSelector);

      return { callback, vertices, edges, schema };
    },
    snapshot => dbState.applyTo(snapshot)
  );

  act(() => {
    result.current.callback({ edges: [edge] });
  });

  await waitFor(() => {
    const etConfig = result.current.schema?.edges.find(
      e => e.type === edge.type
    );
    expect(etConfig).toEqual(expectedEdgeType);
  });
});
