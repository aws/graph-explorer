import { VertexId } from "./entities";
import { createEdgeId, createVertexId, getRawId } from "./entityIdType";

describe("createVertexId", () => {
  it("should create a vertex id out of a string", () => {
    const id = createVertexId("123");
    expect(id).toBe("(str)123");
  });

  it("should create a vertex id out of a number", () => {
    const id = createVertexId(123);
    expect(id).toBe("(num)123");
  });
});

describe("createEdgeId", () => {
  it("should create an edge id out of a string", () => {
    const id = createEdgeId("123");
    expect(id).toBe("(str)123");
  });

  it("should create an edge id out of a number", () => {
    const id = createEdgeId(123);
    expect(id).toBe("(num)123");
  });
});

describe("getRawId", () => {
  it("should return the raw string id without the prefix", () => {
    const id = getRawId("(str)123" as VertexId);
    expect(id).toBe("123");
  });

  it("should return the raw number id without the prefix", () => {
    const id = getRawId("(num)123" as VertexId);
    expect(id).toBe(123);
  });

  it("should return the id as is if it is not marked as a string or number", () => {
    const id = getRawId("123" as VertexId);
    expect(id).toBe("123");
  });
});
