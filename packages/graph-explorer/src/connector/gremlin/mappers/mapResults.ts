import { GAnyValue } from "../types";
import mapApiEdge from "./mapApiEdge";
import mapApiVertex from "./mapApiVertex";
import { MapValueResult, mapValuesToQueryResults } from "@/connector/mapping";
import { createScalar } from "@/core";

export function mapResults(data: GAnyValue) {
  const values = mapAnyValue(data);

  return mapValuesToQueryResults(values);
}

function mapAnyValue(data: GAnyValue): MapValueResult[] {
  if (typeof data === "string" || typeof data === "boolean" || data === null) {
    return [createScalar(data)];
  } else if (
    data["@type"] === "g:Int32" ||
    data["@type"] === "g:Int64" ||
    data["@type"] === "g:Double"
  ) {
    return [createScalar(data["@value"])];
  } else if (data["@type"] === "g:Edge") {
    return [mapApiEdge(data)];
  } else if (data["@type"] === "g:Vertex") {
    return [mapApiVertex(data)];
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
