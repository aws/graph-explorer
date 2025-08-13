import { GAnyValue } from "../types";
import mapApiEdge from "./mapApiEdge";
import mapApiVertex from "./mapApiVertex";
import {
  createResultScalar,
  getDisplayValueForScalar,
  ResultEntity,
} from "@/core";

export function mapResults(data: GAnyValue) {
  return mapAnyValue(data);
}

function mapAnyValue(data: GAnyValue, name?: string): ResultEntity[] {
  if (typeof data === "string" || typeof data === "boolean" || data === null) {
    return [createResultScalar({ value: data, name })];
  } else if (
    data["@type"] === "g:Int32" ||
    data["@type"] === "g:Int64" ||
    data["@type"] === "g:Double" ||
    data["@type"] === "g:T"
  ) {
    return [createResultScalar({ value: data["@value"], name })];
  } else if (data["@type"] === "g:Date") {
    return [createResultScalar({ value: new Date(data["@value"]), name })];
  } else if (data["@type"] === "g:Edge") {
    return [mapApiEdge(data, name)];
  } else if (data["@type"] === "g:Vertex") {
    return [mapApiVertex(data, name)];
  } else if (data["@type"] === "g:Path") {
    return mapAnyValue(data["@value"].objects);
  } else if (data["@type"] === "g:Map") {
    // Handle Maps specially to extract key-value pairs for scalar naming
    const results: ResultEntity[] = [];
    for (let i = 0; i < data["@value"].length; i += 2) {
      const key = data["@value"][i];
      const value = data["@value"][i + 1];

      if (key !== undefined && value !== undefined) {
        // Use the key as the name if it can be parsed to a string
        const scalarName = (() => {
          // Try mapping and see if it comes out as a scalar
          const mapped = mapAnyValue(key);
          const firstScalar = mapped.filter(m => m.entityType === "scalar")[0];
          const displayValue = firstScalar
            ? getDisplayValueForScalar(firstScalar.value)
            : undefined;
          // Only use string scalar values as name
          return displayValue;
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
