import { Vertex, VertexId } from "@/core";
import { RawResult } from "../types";

const mapRawResultToVertex = (rawResult: RawResult): Vertex => {
  return {
    entityType: "vertex",
    id: rawResult.uri as VertexId,
    idType: "string",
    type: rawResult.class,
    attributes: rawResult.attributes,
    __isBlank: rawResult.isBlank,
  };
};

export default mapRawResultToVertex;
