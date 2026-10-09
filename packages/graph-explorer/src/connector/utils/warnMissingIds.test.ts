import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createEdgeId, createVertexId } from "@/core";
import { logger } from "@/utils";

import { warnMissingIds } from "./warnMissingIds";

describe("warnMissingIds", () => {
  const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it("does not warn when every requested id was found", () => {
    const a = createVertexId("a");
    const b = createVertexId("b");
    warnMissingIds("vertices", [a, b], [a, b], 1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns with the requested ids and the missing ones", () => {
    const a = createEdgeId("a");
    const b = createEdgeId("b");
    const c = createEdgeId("c");
    warnMissingIds("edges", [a, b, c], [a], 1);
    expect(warnSpy).toHaveBeenCalledWith("Did not find all requested edges", {
      requested: [a, b, c],
      missing: [b, c],
      response: 1,
    });
  });

  it("only accepts ids that match the entity label", () => {
    const vertexId = createVertexId("a");
    const edgeId = createEdgeId("a");
    // @ts-expect-error edge ids can't be reported as vertices
    warnMissingIds("vertices", [edgeId], [], 1);
    // @ts-expect-error vertex ids can't be reported as edges
    warnMissingIds("edges", [vertexId], [], 1);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
