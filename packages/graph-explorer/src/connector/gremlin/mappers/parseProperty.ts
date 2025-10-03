import { EntityPropertyValue } from "@/core";
import type { GProperty, GVertexProperty } from "../types";

export default function parseProperty(
  property: GVertexProperty | GProperty
): EntityPropertyValue {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  if (typeof property["@value"].value === "boolean") {
    return property["@value"].value;
  }

  if (property["@value"].value["@type"] === "g:Date") {
    return new Date(property["@value"].value["@value"]);
  }

  return property["@value"].value["@value"];
}
