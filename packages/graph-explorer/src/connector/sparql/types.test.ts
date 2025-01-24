import { EdgeId } from "@/core";
import { parseEdgeId } from "./types";

test("parseEdgeId", () => {
  const edgeId =
    "http://example.com/source-[http://example.com/predicate]->http://example.com/target" as EdgeId;
  const { source, predicate, target } = parseEdgeId(edgeId);
  expect(source).toBe("http://example.com/source");
  expect(predicate).toBe("http://example.com/predicate");
  expect(target).toBe("http://example.com/target");
});
