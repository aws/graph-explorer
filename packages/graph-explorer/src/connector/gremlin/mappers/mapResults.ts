import {
  type ResultEntity,
  createResultScalar,
  createResultBundle,
  getDisplayValueForScalar,
  type ResultScalar,
} from "@/connector/entities";
import { type GAnyValue, type GList } from "../types";
import mapApiEdge from "./mapApiEdge";
import mapApiVertex from "./mapApiVertex";

export function mapResults(data: GList) {
  const entities = data["@value"].flatMap(value => mapAnyValue(value));

  // Promote the child values of a bundle if there is only one and it has no name
  if (entities.length === 1) {
    const firstEntity = entities[0];
    if (firstEntity.entityType === "bundle" && firstEntity.name == null) {
      return firstEntity.values;
    }
  }

  return entities;
}

export function mapAnyValue(data: GAnyValue, name?: string): ResultEntity[] {
  if (
    typeof data === "string" ||
    typeof data === "boolean" ||
    data === null ||
    data === undefined
  ) {
    return [createResultScalar({ value: data ?? null, name })];
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
    // A path always has a list as the objects which will result in a bundle that should be flattened
    const values: ResultEntity[] = [];

    for (let i = 0; i < data["@value"].objects["@value"].length; i++) {
      const value = data["@value"].objects["@value"][i];
      const label = data["@value"].labels["@value"][i];
      const name = mapToStringIfPossible(label);
      const valueResults = mapAnyValue(value, name);
      values.push(...valueResults);
    }

    return [createResultBundle({ name, values })];
  } else if (data["@type"] === "g:Map" || data["@type"] === "g:BulkSet") {
    // Handle Maps specially to extract key-value pairs for scalar naming
    const results: ResultEntity[] = [];

    for (let i = 0; i < data["@value"].length; i += 2) {
      const key = data["@value"][i];
      const value = data["@value"][i + 1];

      // Use the key as the name if it can be parsed to a string
      const scalarName = mapToStringIfPossible(key);
      const valueResults = mapAnyValue(value, scalarName);
      results.push(...valueResults);
    }

    // Promote the children if there is no name and one or fewer children
    if (results.length <= 1 && !name) {
      return results;
    }

    return [createResultBundle({ name, values: results })];
  } else if (data["@type"] === "g:List" || data["@type"] === "g:Set") {
    const gValues = data["@value"];

    // Promote a single item in a list up a level
    if (gValues.length === 1) {
      return mapAnyValue(gValues[0], name);
    }

    // Empty lists should not create a bundle unless there is a name
    if (gValues.length === 0 && !name) {
      return [];
    }

    const results = data["@value"].flatMap((item: GAnyValue) =>
      mapAnyValue(item)
    );
    return [createResultBundle({ name, values: results })];
  }

  // Unsupported type
  return [];
}

function mapToStringIfPossible(value: GAnyValue): string | undefined {
  // Try mapping and see if it comes out as a scalar
  const mapped = mapAnyValue(value);
  const firstScalar = getFirstScalar(mapped);
  if (firstScalar && firstScalar.value) {
    return getDisplayValueForScalar(firstScalar.value);
  }
  return undefined;
}

function getFirstScalar(values: ResultEntity[]): ResultScalar | null {
  for (const value of values) {
    if (value.entityType === "scalar") {
      return value;
    } else if (value.entityType === "bundle") {
      return getFirstScalar(value.values);
    }
  }
  return null;
}
