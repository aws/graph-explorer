// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";
import { createStore } from "jotai";

import {
  createEdgeId,
  createVertex,
  createVertexId,
  createVertexType,
} from "@/core/entities";
import { iconRegistry } from "@/core/icons";
import { LABELS } from "@/utils";
import {
  createRandomEdge,
  createRandomVertex,
  createTestableVertex,
  DbState,
  renderHookWithJotai,
} from "@/utils/testing";

import {
  canvasVertexStylesAtom,
  createRenderedEdgeId,
  createRenderedVertexId,
  getEdgeIdFromRenderedEdgeId,
  getVertexIdFromRenderedVertexId,
  type RenderedEdgeId,
  type RenderedVertexId,
  useRenderedEntities,
  visibleVertexIdsAtom,
} from "./renderedEntities";

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
      createRenderedVertexId(createVertexId("123")),
    );
    expect(id).toBe("123");
  });

  it("should return the raw number id without the prefix", () => {
    const id = getVertexIdFromRenderedVertexId(
      createRenderedVertexId(createVertexId(123)),
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
      createRenderedEdgeId(createEdgeId("123")),
    );
    expect(id).toBe("123");
  });

  it("should return the raw number id without the prefix", () => {
    const id = getEdgeIdFromRenderedEdgeId(
      createRenderedEdgeId(createEdgeId(123)),
    );
    expect(id).toBe(123);
  });

  it("should return the id as is if it is not marked as a string or number", () => {
    const id = getEdgeIdFromRenderedEdgeId("123" as RenderedEdgeId);
    expect(id).toBe("123");
  });
});

describe("visibleVertexIdsAtom", () => {
  it("should exclude vertices filtered by ID and by type", () => {
    const dbState = new DbState();
    const kept = createTestableVertex();
    const filteredById = createTestableVertex();
    const filteredByType = createTestableVertex();

    dbState.addTestableVertexToGraph(kept);
    dbState.addTestableVertexToGraph(filteredById);
    dbState.addTestableVertexToGraph(filteredByType);
    dbState.filterVertex(filteredById.id);
    dbState.filterVertexType(createVertexType(filteredByType.types[0]));

    const store = createStore();
    dbState.applyTo(store);

    expect([...store.get(visibleVertexIdsAtom)]).toStrictEqual([kept.id]);
  });
});

describe("canvasVertexStylesAtom", () => {
  // The point of the atom: a schema can carry far more types than the canvas
  // draws, and resolving an icon for every one of them dominated render cost.
  it("should cover only the types drawn on the canvas", () => {
    const dbState = new DbState();
    const onCanvas = createTestableVertex();
    dbState.addTestableVertexToGraph(onCanvas);
    dbState.addVertexStyle(createVertexType("NotOnCanvas"), {
      color: "#123456",
    });

    const store = createStore();
    dbState.applyTo(store);

    expect(store.get(canvasVertexStylesAtom).map(s => s.type)).toStrictEqual([
      createVertexType(onCanvas.types[0]),
    ]);
  });

  it("should exclude the types of filtered-out vertices", () => {
    const dbState = new DbState();
    const kept = createTestableVertex();
    const filtered = createTestableVertex();
    dbState.addTestableVertexToGraph(kept);
    dbState.addTestableVertexToGraph(filtered);
    dbState.filterVertex(filtered.id);

    const store = createStore();
    dbState.applyTo(store);

    expect(store.get(canvasVertexStylesAtom).map(s => s.type)).toStrictEqual([
      createVertexType(kept.types[0]),
    ]);
  });

  // `useAllVertexStyles` states this guarantee explicitly; here it has to hold
  // via `createVertex` defaulting an untyped vertex to `LABELS.MISSING_TYPE`.
  // Without it, blank nodes lose their icon silently.
  it("should cover a blank node's synthetic missing type", () => {
    const dbState = new DbState();
    dbState.addVertexToGraph(
      createVertex({ id: "blank", isBlankNode: true, types: [] }),
    );

    const store = createStore();
    dbState.applyTo(store);

    expect(store.get(canvasVertexStylesAtom).map(s => s.type)).toStrictEqual([
      LABELS.MISSING_TYPE,
    ]);
  });

  it("should list a shared type once", () => {
    const dbState = new DbState();
    const first = createTestableVertex();
    const second = createTestableVertex().with({ types: first.types });
    dbState.addTestableVertexToGraph(first);
    dbState.addTestableVertexToGraph(second);

    const store = createStore();
    dbState.applyTo(store);

    expect(store.get(canvasVertexStylesAtom)).toHaveLength(1);
  });
});

// The canvas resolves icons only for the types it draws, so the scope and the
// per-element lookup have to agree. A miss is silent — the node just renders
// without an icon — so assert the hit case on a real element.
describe("useRenderedVertices icon coverage", () => {
  beforeEach(() => {
    iconRegistry.reset();
  });

  it("should carry the resolved icon url onto the element data", async () => {
    const dbState = new DbState();
    const vertex = createTestableVertex();
    dbState.addTestableVertexToGraph(vertex);
    // A raster icon resolves synchronously in the registry, so no fetch stub.
    dbState.addVertexStyle(createVertexType(vertex.types[0]), {
      iconUrl: "https://example.test/icon.png",
      iconImageType: "image/png",
      color: "#abcdef",
    });

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store),
    );

    await waitFor(() => {
      expect(result.current.vertices[0].data.__iconUrl).toBe(
        "https://example.test/icon.png",
      );
      expect(result.current.vertices[0].data.ge_color).toBe("#abcdef");
    });
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
      store => dbState.applyTo(store),
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

    dbState.filterVertexType(createVertexType(vertex1.types[0]));

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store),
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
      createRandomEdge(dbState.vertices[0], dbState.vertices[1]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[2]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[2], dbState.vertices[0]),
    );

    dbState.filterEdge(dbState.edges[0].id);

    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[1].id),
      createRenderedEdgeId(dbState.edges[2].id),
      createRenderedEdgeId(dbState.edges[3].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store),
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
      createRandomEdge(dbState.vertices[0], dbState.vertices[1]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[2]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[2], dbState.vertices[0]),
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
      store => dbState.applyTo(store),
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
      createRandomEdge(dbState.vertices[0], dbState.vertices[1]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], dbState.vertices[2]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[2], dbState.vertices[0]),
    );

    dbState.filterVertex(dbState.vertices[1].id);

    // Only expect the edges connected to vertex indices 0 and 2
    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[2].id),
      createRenderedEdgeId(dbState.edges[3].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store),
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
      createRandomEdge(dbState.vertices[0], dbState.vertices[1]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[1], dbState.vertices[0]),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(dbState.vertices[0], missingVertex),
    );
    dbState.addEdgeToGraph(
      createRandomEdge(missingVertex, dbState.vertices[0]),
    );

    // Only expect the edges connected to vertex indices 0 and 2
    const expectedRenderedEdges = [
      createRenderedEdgeId(dbState.edges[0].id),
      createRenderedEdgeId(dbState.edges[1].id),
    ];

    const { result } = renderHookWithJotai(
      () => useRenderedEntities(),
      store => dbState.applyTo(store),
    );

    await waitFor(() => {
      const edgeIds = result.current.edges.map(e => e.data.id);
      expect(edgeIds).toEqual(expectedRenderedEdges);
    });
  });
});
