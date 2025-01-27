import { createEdgeId, createVertexId } from "@/core";
import { parseEdgeId } from "./types";

test("parseEdgeId", () => {
  const edgeId = createEdgeId(
    "http://example.com/source-[http://example.com/predicate]->http://example.com/target"
  );
  const { source, predicate, target } = parseEdgeId(edgeId);
  expect(source).toBe(createVertexId("http://example.com/source"));
  expect(predicate).toBe(createEdgeId("http://example.com/predicate"));
  expect(target).toBe(createVertexId("http://example.com/target"));
});
