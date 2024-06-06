import { Vertex } from "../../../@types/entities";
import { RawResult } from "../types";

export default function mapRawResultToVertex(rawResult: RawResult): Vertex {
  return {
    data: {
      id: rawResult.uri,
      idType: "string",
      type: rawResult.class,
      attributes: rawResult.attributes,
      __isBlank: rawResult.isBlank,
    },
  };
}
