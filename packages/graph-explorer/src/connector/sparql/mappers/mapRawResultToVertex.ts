import { createVertex } from "@/core";
import { RawResult } from "../types";

const mapRawResultToVertex = (rawResult: RawResult) => {
  return createVertex({
    id: rawResult.uri,
    types: [rawResult.class],
    attributes: rawResult.attributes,
    isBlankNode: rawResult.isBlank,
  });
};

export default mapRawResultToVertex;
