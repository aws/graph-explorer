import { GAnyValue } from "../types";
import mapApiEdge from "./mapApiEdge";
import mapApiVertex from "./mapApiVertex";
import { mapValuesToQueryResults } from "@/connector/mapping";
import { createScalar, Entity } from "@/core";

export function mapResults(data: GAnyValue) {
  const values = mapAnyValue(data);

  return mapValuesToQueryResults(values);
}

function mapAnyValue(data: GAnyValue, name?: string): Entity[] {
  if (typeof data === "string" || typeof data === "boolean" || data === null) {
    return [createScalar(data, name)];
  } else if (
    data["@type"] === "g:Int32" ||
    data["@type"] === "g:Int64" ||
    data["@type"] === "g:Double" ||
    data["@type"] === "g:T"
  ) {
    return [createScalar(data["@value"], name)];
  } else if (data["@type"] === "g:Date") {
    return [createScalar(new Date(data["@value"]), name)];
  } else if (data["@type"] === "g:Edge") {
    return [mapApiEdge(data)];
  } else if (data["@type"] === "g:Vertex") {
    return [mapApiVertex(data)];
  } else if (data["@type"] === "g:Path") {
    return mapAnyValue(data["@value"].objects);
  } else if (data["@type"] === "g:Map") {
    // Handle Maps specially to extract key-value pairs for scalar naming
    const results: Entity[] = [];
    for (let i = 0; i < data["@value"].length; i += 2) {
      const key = data["@value"][i];
      const value = data["@value"][i + 1];

      if (key !== undefined && value !== undefined) {
        // Use the key as the name if it can be parsed to a string
        const scalarName = (() => {
          // Try mapping and see if it comes out as a scalar
          const mapped = mapAnyValue(key);
          const firstScalar = mapped.filter(m => m.entityType === "scalar")[0];
          // Only use string scalar values as name
          return firstScalar && firstScalar.type === "string"
            ? firstScalar.value
            : undefined;
        })();

        results.push(...mapAnyValue(value, scalarName));
      }
    }
    return results;
  } else if (data["@type"] === "g:List" || data["@type"] === "g:Set") {
    return data["@value"].flatMap((item: GAnyValue) => mapAnyValue(item));
  }

  // Unsupported type
  return [];
}
