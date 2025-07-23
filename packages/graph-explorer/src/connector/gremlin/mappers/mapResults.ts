import { MISSING_DISPLAY_VALUE } from "@/utils";
import { GAnyValue } from "../types";
import mapApiEdge from "./mapApiEdge";
import mapApiVertex from "./mapApiVertex";
import { MapValueResult, mapValuesToQueryResults } from "@/connector/mapping";

export function mapResults(data: GAnyValue) {
  const values = mapAnyValue(data);

  return mapValuesToQueryResults(values);
}

function mapAnyValue(data: GAnyValue): MapValueResult[] {
  if (typeof data === "string") {
    return [{ scalar: data }];
  } else if (typeof data === "boolean") {
    return [{ scalar: data }];
  } else if (data === null) {
    return [{ scalar: MISSING_DISPLAY_VALUE }];
  } else if (
    data["@type"] === "g:Int32" ||
    data["@type"] === "g:Int64" ||
    data["@type"] === "g:Double"
  ) {
    return [{ scalar: data["@value"] }];
  } else if (data["@type"] === "g:Edge") {
    return [{ edge: mapApiEdge(data) }];
  } else if (data["@type"] === "g:Vertex") {
    return [{ vertex: mapApiVertex(data) }];
  } else if (data["@type"] === "g:Path") {
    return mapAnyValue(data["@value"].objects);
  } else if (
    data["@type"] === "g:List" ||
    data["@type"] === "g:Map" ||
    data["@type"] === "g:Set"
  ) {
    return data["@value"].flatMap((item: GAnyValue) => mapAnyValue(item));
  }

  // Unsupported type
  return [];
}
