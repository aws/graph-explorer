import {
  createRandomEdge,
  createRandomVertex,
  createTestableVertex,
  DbState,
  renderHookWithJotai,
} from "@/utils/testing";
import { createEdgeId, createVertexId } from "@/core/entities";
import {
  createRenderedEdgeId,
  createRenderedVertexId,
  getEdgeIdFromRenderedEdgeId,
  getVertexIdFromRenderedVertexId,
  type RenderedEdgeId,
  type RenderedVertexId,
  useRenderedEntities,
} from "./renderedEntities";
import { waitFor } from "@testing-library/react";

describe("createRenderedVertexId", () => {
  it("should create a rendered vertex id out of a string", () => {
    const id = createRenderedVertexId(createVertexId("123"));
    expect(id).toBe("(str)123");
  });

  it("should create a rendered vertex id out of a number", () => {
    const id = createRenderedVertexId(createVertexId(123));
    expect(id).toBe("(num)123");
  });
});

describe("createRenderedEdgeId", () => {
  it("should create a rendered edge id out of a string", () => {
    const id = createRenderedEdgeId(createEdgeId("123"));
    expect(id).toBe("(str)123");
  });

  it("should create a rendered edge id out of a number", () => {
    const id = createRenderedEdgeId(createEdgeId(123));
    expect(id).toBe("(num)123");
  });
});

describe("getVertexIdFromRenderedVertexId", () => {
  it("should return the raw string id without the prefix", () => {
    const id = getVertexIdFromRenderedVertexId(
      createRenderedVertexId(createVertexId("123"))
    );
    expect(id).toBe("123");
  });

  it("should return the raw number id without the prefix", () => {
    const id = getVertexIdFromRenderedVertexId(
      createRenderedVertexId(createVertexId(123))
    );
    expect(id).toBe(123);
  });

  it("should return the id as is if it is not marked as a string or number", () => {
    const id = getVertexIdFromRenderedVertexId("123" as RenderedVertexId);
    expect(id).toBe("123");
  });
});

describe("getEdgeIdFromRenderedEdgeId", () => {
  it("should return the raw string id without the prefix", () => {
    const id = getEdgeIdFromRenderedEdgeId(
      createRenderedEdgeId(createEdgeId("123"))
    );
    expect(id).toBe("123");
  });

  it("should return the raw number id without the prefix", () => {
    const id = getEdgeIdFromRenderedEdgeId(
      createRenderedEdgeId(createEdgeId(123))
    );
    expect(id).toBe(123);
  });

  it("should return the id as is if it is not marked as a string or number", () => {
    const id = getEdgeIdFromRenderedEdgeId("123" as RenderedEdgeId);
    expect(id).toBe("123");
  });
});

describe("useRenderedVertices", () => {
  it("should return the filtered vertices by ID", async () => {
    const dbState = new DbState();
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());
    dbState.filterVertex(dbState.vertices[0].id);

    const expectedRenderedVertices = [
      createRenderedVertexId(dbState.vertices[1].id),
      createRenderedVertexId(dbState.vertices[2].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store)
    );

    await waitFor(() => {
      const vertexIds = result.current.vertices.map(v => v.data.id);
      expect(vertexIds).toEqual(expectedRenderedVertices);
    });
  });

  it("should return the filtered vertices by type", async () => {
    const dbState = new DbState();

    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex().with({ types: vertex1.types });
    const vertex3 = createTestableVertex();

    dbState.addTestableVertexToGraph(vertex1);
    dbState.addTestableVertexToGraph(vertex2);
    dbState.addTestableVertexToGraph(vertex3);

    dbState.filterVertexType(vertex1.types[0]);

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store)
    );

    await waitFor(() => {
      const vertexIds = result.current.vertices.map(v => v.data.vertexId);
      expect(vertexIds).toStrictEqual([vertex3.id]);
    });
  });
});

describe("useRenderedEdges", () => {
  it("should return the filtered edges by ID", async () => {
    const dbState = new DbState();
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());

    // Create edges
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[1])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[2])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[2], dbState.vertices[0])
    );

    dbState.filterEdge(dbState.edges[0].id);

    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[1].id),
      createRenderedEdgeId(dbState.edges[2].id),
      createRenderedEdgeId(dbState.edges[3].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store)
    );

    await waitFor(() => {
      const edgeIds = result.current.edges.map(e => e.data.id);
      expect(edgeIds).toEqual(expectedRenderedEdges);
    });
  });

  it("should return the filtered edges by type", async () => {
    const dbState = new DbState();
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());

    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[1])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[2])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[2], dbState.vertices[0])
    );

    // Ensure two edges have the same type
    dbState.edges[0].type = dbState.edges[1].type;

    dbState.filterEdgeType(dbState.edges[0].type);

    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[2].id),
      createRenderedEdgeId(dbState.edges[3].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store)
    );

    await waitFor(() => {
      const edgeIds = result.current.edges.map(e => e.data.id);
      expect(edgeIds).toEqual(expectedRenderedEdges);
    });
  });

  it("should filter out edges where source or target vertex is filtered out", async () => {
    const dbState = new DbState();
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());

    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[1])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[2])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[2], dbState.vertices[0])
    );

    dbState.filterVertex(dbState.vertices[1].id);

    // Only expect the edges connected to vertex indices 0 and 2
    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[2].id),
      createRenderedEdgeId(dbState.edges[3].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store)
    );

    await waitFor(() => {
      const edgeIds = result.current.edges.map(e => e.data.id);
      expect(edgeIds).toEqual(expectedRenderedEdges);
    });
  });

  it("should filter out edges where source or target vertex doesn't exist", async () => {
    const dbState = new DbState();
    const missingVertex = createRandomVertex();
    dbState.addVertexToGraph(createRandomVertex());
    dbState.addVertexToGraph(createRandomVertex());

    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[1])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0])
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], missingVertex)
    );
    dbState.addEdgeToGraph(
      createRandomEdge(missingVertex, dbState.vertices[0])
    );

    // Only expect the edges connected to vertex indices 0 and 2
    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[0].id),
      createRenderedEdgeId(dbState.edges[1].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store)
    );

    await waitFor(() => {
      const edgeIds = result.current.edges.map(e => e.data.id);
      expect(edgeIds).toEqual(expectedRenderedEdges);
    });
  });
});
