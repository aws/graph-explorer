import { createVertexId, Vertex } from "@/core";
import { RawResult } from "../types";

const mapRawResultToVertex = (rawResult: RawResult): Vertex => {
  return {
    entityType: "vertex",
    id: createVertexId(rawResult.uri),
    idType: "string",
    type: rawResult.class,
    attributes: rawResult.attributes,
    __isBlank: rawResult.isBlank,
  };
};

export default mapRawResultToVertex;
