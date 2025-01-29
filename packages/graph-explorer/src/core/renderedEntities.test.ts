import { createEdgeId, createVertexId } from "./entityIdType";
import {
  createRenderedEdgeId,
  createRenderedVertexId,
  getEdgeIdFromRenderedEdgeId,
  getVertexIdFromRenderedVertexId,
  RenderedEdgeId,
  RenderedVertexId,
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
