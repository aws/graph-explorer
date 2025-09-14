import type { GProperty, GVertexProperty } from "../types";
import { type EntityPropertyValue } from "@/core";

export default function parseProperty(
  property: GVertexProperty | GProperty
): EntityPropertyValue {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  if (typeof property["@value"].value === "boolean") {
    return property["@value"].value;
  }

  return property["@value"].value["@value"];
}
