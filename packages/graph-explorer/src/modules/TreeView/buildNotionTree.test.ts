import {
  createEdge,
  createVertex,
  type Edge,
  toEdgeMap,
  toNodeMap,
  type Vertex,
} from "@/core";

import { buildNotionTree } from "./buildNotionTree";

function vertex(id: string, type: string): Vertex {
  return createVertex({ id, types: [type] });
}

function edge(type: string, source: Vertex, target: Vertex): Edge {
  return createEdge({
    id: `${String(source.id)}-${type}-${String(target.id)}`,
    type,
    sourceId: source.id,
    targetId: target.id,
  });
}

describe("buildNotionTree", () => {
  it("returns notion groups without a contains parent as roots", () => {
    const root = vertex("root", "notionGroup");
    const child = vertex("child", "notionGroup");
    const nodes = toNodeMap([root, child]);
    const edges = toEdgeMap([edge("contains", root, child)]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(1);
    expect(tree[0].vertex.id).toBe(root.id);
  });

  it("nests notion children under their notion group via contains edges", () => {
    const group = vertex("group", "notionGroup");
    const notionA = vertex("a", "notion");
    const notionB = vertex("b", "notion");
    const nodes = toNodeMap([group, notionA, notionB]);
    const edges = toEdgeMap([
      edge("contains", group, notionA),
      edge("contains", group, notionB),
    ]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(1);
    const childIds = tree[0].children.map(c => c.vertex.id);
    expect(childIds).toEqual([notionA.id, notionB.id]);
  });

  it("supports nested notion groups", () => {
    const root = vertex("root", "notionGroup");
    const sub = vertex("sub", "notionGroup");
    const leaf = vertex("leaf", "notion");
    const nodes = toNodeMap([root, sub, leaf]);
    const edges = toEdgeMap([
      edge("contains", root, sub),
      edge("contains", sub, leaf),
    ]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].vertex.id).toBe(sub.id);
    expect(tree[0].children[0].children[0].vertex.id).toBe(leaf.id);
  });

  it("excludes vertices that are not notion groups or notions", () => {
    const group = vertex("group", "notionGroup");
    const book = vertex("book", "book");
    const nodes = toNodeMap([group, book]);
    const edges = toEdgeMap([edge("contains", group, book)]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(0);
  });

  it("ignores edges that are not contains edges", () => {
    const group = vertex("group", "notionGroup");
    const notion = vertex("notion", "notion");
    const nodes = toNodeMap([group, notion]);
    const edges = toEdgeMap([edge("references", group, notion)]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(0);
  });

  it("does not include a notion that has no contains parent", () => {
    const orphan = vertex("orphan", "notion");
    const nodes = toNodeMap([orphan]);
    const edges = toEdgeMap([]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(0);
  });

  it("returns no roots when every notion group is contained by another", () => {
    // A pure cycle: both groups have a parent, so neither qualifies as a root.
    const a = vertex("a", "notionGroup");
    const b = vertex("b", "notionGroup");
    const nodes = toNodeMap([a, b]);
    const edges = toEdgeMap([edge("contains", a, b), edge("contains", b, a)]);

    const tree = buildNotionTree(nodes, edges);

    expect(tree).toHaveLength(0);
  });

  it("breaks contains cycles reachable from a root without infinite recursion", () => {
    const root = vertex("root", "notionGroup");
    const a = vertex("a", "notionGroup");
    const b = vertex("b", "notionGroup");
    const nodes = toNodeMap([root, a, b]);
    const edges = toEdgeMap([
      edge("contains", root, a),
      edge("contains", a, b),
      edge("contains", b, a),
    ]);

    const tree = buildNotionTree(nodes, edges);

    // `root` is the only root. root → a → b, then b → a is skipped because `a`
    // is already an ancestor.
    expect(tree).toHaveLength(1);
    expect(tree[0].vertex.id).toBe(root.id);
    expect(tree[0].children[0].vertex.id).toBe(a.id);
    expect(tree[0].children[0].children[0].vertex.id).toBe(b.id);
    expect(tree[0].children[0].children[0].children).toHaveLength(0);
  });
});
