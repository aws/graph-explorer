import { Vertex, Edge } from "@/core";
import { GAnyValue } from "../types";
import mapApiEdge from "./mapApiEdge";
import mapApiVertex from "./mapApiVertex";

export type ScalarValue = number | string | Date;

export type MappedQueryResults = {
  vertices: Vertex[];
  edges: Edge[];
  scalars: ScalarValue[];
};

export function mapResults(data: GAnyValue) {
  const values = mapAnyValue(data);

  const result: MappedQueryResults = {
    vertices: values.filter(e => "vertex" in e).map(e => e.vertex),
    edges: values.filter(e => "edge" in e).map(e => e.edge),
    scalars: values.filter(s => "scalar" in s).map(s => s.scalar),
  };

  return result;
}

function mapAnyValue(
  data: GAnyValue
): Array<{ vertex: Vertex } | { edge: Edge } | { scalar: string | number }> {
  if (typeof data === "string") {
    return [{ scalar: data }];
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
