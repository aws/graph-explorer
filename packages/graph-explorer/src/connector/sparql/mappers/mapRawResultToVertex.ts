import { type RawResult } from "../types";
import { createVertex } from "@/core";

const mapRawResultToVertex = (rawResult: RawResult) => {
  return createVertex({
    id: rawResult.uri,
    types: [rawResult.class],
    attributes: rawResult.attributes,
    isBlankNode: rawResult.isBlank,
  });
};

export default mapRawResultToVertex;
