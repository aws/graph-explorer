import { describe, it, expect, beforeEach } from "vitest";
import {
  renderHookWithState,
  DbState,
  createTestableVertex,
  createTestableEdge,
} from "@/utils/testing";
import { useContextMenuTarget } from "./useContextMenuTarget";
import type { EdgeId, VertexId } from "@/core";

describe("useContextMenuTarget", () => {
  let state: DbState;

  beforeEach(() => {
    state = new DbState();
  });

  function renderHookContextMenuTarget(params: {
    affectedVertexIds: VertexId[];
    affectedEdgeIds: EdgeId[];
    selectedVertexIds: VertexId[];
    selectedEdgeIds: EdgeId[];
  }) {
    return renderHookWithState(() => useContextMenuTarget(params), state);
  }

  it("should return single-vertex when one vertex is affected and not in selection", () => {
    const vertex = createTestableVertex();
    state.addTestableVertexToGraph(vertex);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [vertex.id],
      affectedEdgeIds: [],
      selectedVertexIds: [],
      selectedEdgeIds: [],
    });

    expect(result.current).toStrictEqual({
      type: "single-vertex",
      vertexId: vertex.id,
    });
  });

  it("should return single-vertex when one vertex is affected and selection contains only that vertex", () => {
    const vertex = createTestableVertex();
    state.addTestableVertexToGraph(vertex);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [vertex.id],
      affectedEdgeIds: [],
      selectedVertexIds: [vertex.id],
      selectedEdgeIds: [],
    });

    expect(result.current).toStrictEqual({
      type: "single-vertex",
      vertexId: vertex.id,
    });
  });

  it("should return single-edge when one edge is affected and not in selection", () => {
    const edge = createTestableEdge();
    state.addTestableEdgeToGraph(edge);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [edge.id],
      selectedVertexIds: [],
      selectedEdgeIds: [],
    });

    expect(result.current).toStrictEqual({
      type: "single-edge",
      edgeId: edge.id,
    });
  });

  it("should return single-edge when one edge is affected and selection contains only that edge", () => {
    const edge = createTestableEdge();
    state.addTestableEdgeToGraph(edge);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [edge.id],
      selectedVertexIds: [],
      selectedEdgeIds: [edge.id],
    });

    expect(result.current).toStrictEqual({
      type: "single-edge",
      edgeId: edge.id,
    });
  });

  it("should return multiple-vertices when multiple vertices selected and affected vertex within selection", () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    state.addTestableVertexToGraph(vertex1);
    state.addTestableVertexToGraph(vertex2);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [vertex1.id],
      affectedEdgeIds: [],
      selectedVertexIds: [vertex1.id, vertex2.id],
      selectedEdgeIds: [],
    });

    expect(result.current).toStrictEqual({
      type: "multiple-vertices",
      vertexIds: [vertex1.id, vertex2.id],
    });
  });

  it("should return multiple-edges when multiple edges selected and affected edge within selection", () => {
    const edge1 = createTestableEdge();
    const edge2 = createTestableEdge();
    state.addTestableEdgeToGraph(edge1);
    state.addTestableEdgeToGraph(edge2);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [edge1.id],
      selectedVertexIds: [],
      selectedEdgeIds: [edge1.id, edge2.id],
    });

    expect(result.current).toStrictEqual({
      type: "multiple-edges",
      edgeIds: [edge1.id, edge2.id],
    });
  });

  it("should return multiple-vertices-and-edges when both selected and affected vertex within selection", () => {
    const vertex = createTestableVertex();
    const edge = createTestableEdge();
    state.addTestableVertexToGraph(vertex);
    state.addTestableEdgeToGraph(edge);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [vertex.id],
      affectedEdgeIds: [],
      selectedVertexIds: [vertex.id],
      selectedEdgeIds: [edge.id],
    });

    expect(result.current).toStrictEqual({
      type: "multiple-vertices-and-edges",
      vertexIds: [vertex.id],
      edgeIds: [edge.id],
    });
  });

  it("should return multiple-vertices-and-edges when both selected and affected edge within selection", () => {
    const vertex = createTestableVertex();
    const edge = createTestableEdge();
    state.addTestableVertexToGraph(vertex);
    state.addTestableEdgeToGraph(edge);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [edge.id],
      selectedVertexIds: [vertex.id],
      selectedEdgeIds: [edge.id],
    });

    expect(result.current).toStrictEqual({
      type: "multiple-vertices-and-edges",
      vertexIds: [vertex.id],
      edgeIds: [edge.id],
    });
  });

  it("should return none when no selection and no affected", () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    const edge = createTestableEdge();
    state.addTestableVertexToGraph(vertex1);
    state.addTestableVertexToGraph(vertex2);
    state.addTestableEdgeToGraph(edge);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [],
      selectedVertexIds: [],
      selectedEdgeIds: [],
    });

    expect(result.current.type).toBe("none");
    if (result.current.type === "none") {
      expect(result.current.vertexIds).toHaveLength(4); // 2 vertices + 2 from edge (source + target)
      expect(result.current.edgeIds).toStrictEqual([edge.id]);
    }
  });

  it("should return single-vertex when single affected vertex not in selection", () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    state.addTestableVertexToGraph(vertex1);
    state.addTestableVertexToGraph(vertex2);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [vertex1.id],
      affectedEdgeIds: [],
      selectedVertexIds: [vertex2.id],
      selectedEdgeIds: [],
    });

    expect(result.current).toStrictEqual({
      type: "single-vertex",
      vertexId: vertex1.id,
    });
  });

  it("should return multiple-vertices when multiple affected vertices not in selection", () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    const vertex3 = createTestableVertex();
    state.addTestableVertexToGraph(vertex1);
    state.addTestableVertexToGraph(vertex2);
    state.addTestableVertexToGraph(vertex3);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [vertex1.id, vertex2.id],
      affectedEdgeIds: [],
      selectedVertexIds: [vertex3.id],
      selectedEdgeIds: [],
    });

    expect(result.current).toStrictEqual({
      type: "multiple-vertices",
      vertexIds: [vertex1.id, vertex2.id],
    });
  });

  it("should return single-edge when single affected edge not in selection", () => {
    const edge1 = createTestableEdge();
    const edge2 = createTestableEdge();
    state.addTestableEdgeToGraph(edge1);
    state.addTestableEdgeToGraph(edge2);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [edge1.id],
      selectedVertexIds: [],
      selectedEdgeIds: [edge2.id],
    });

    expect(result.current).toStrictEqual({
      type: "single-edge",
      edgeId: edge1.id,
    });
  });

  it("should return multiple-edges when multiple affected edges not in selection", () => {
    const edge1 = createTestableEdge();
    const edge2 = createTestableEdge();
    const edge3 = createTestableEdge();
    state.addTestableEdgeToGraph(edge1);
    state.addTestableEdgeToGraph(edge2);
    state.addTestableEdgeToGraph(edge3);

    const { result } = renderHookContextMenuTarget({
      affectedVertexIds: [],
      affectedEdgeIds: [edge1.id, edge2.id],
      selectedVertexIds: [],
      selectedEdgeIds: [edge3.id],
    });

    expect(result.current).toStrictEqual({
      type: "multiple-edges",
      edgeIds: [edge1.id, edge2.id],
    });
  });
});
