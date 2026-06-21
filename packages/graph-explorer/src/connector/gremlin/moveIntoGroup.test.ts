import { describe, expect, test } from "vitest";

import { createVertexId } from "@/core";

import { moveIntoGroupQuery } from "./moveIntoGroup";

describe("moveIntoGroupQuery", () => {
  test("drops existing contains edges and adds one from the target group", () => {
    const query = moveIntoGroupQuery({
      vertexId: createVertexId("notion-1"),
      toGroupId: createVertexId("group-2"),
    });

    expect(query).toContain('g.V("notion-1").as("moved")');
    expect(query).toContain('.sideEffect(__.inE("contains").drop())');
    expect(query).toContain('.V("group-2")');
    expect(query.trimEnd().endsWith('.addE("contains").to("moved")')).toBe(
      true,
    );
  });

  test("returns the new edge element, not just its id", () => {
    const query = moveIntoGroupQuery({
      vertexId: createVertexId("notion-1"),
      toGroupId: createVertexId("group-2"),
    });

    // Returning the edge lets the standard mapper resolve engine-specific edge
    // ids (e.g. JanusGraph relation identifiers).
    expect(query).not.toContain(".id()");
  });

  test("does not reference the source group, since all contains edges are dropped", () => {
    const query = moveIntoGroupQuery({
      vertexId: createVertexId("notion-1"),
      toGroupId: createVertexId("group-2"),
    });

    expect(query).not.toContain("group-1");
  });

  test("uses the L suffix for numeric ids", () => {
    const query = moveIntoGroupQuery({
      vertexId: createVertexId(42),
      toGroupId: createVertexId(7),
    });

    expect(query).toContain("g.V(42L)");
    expect(query).toContain(".V(7L)");
  });
});
