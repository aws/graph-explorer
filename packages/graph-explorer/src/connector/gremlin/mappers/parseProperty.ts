import { EntityPropertyValue } from "@/core";
import type { GProperty, GVertexProperty } from "../types";

export default function parseProperty(
  property: GVertexProperty | GProperty
): EntityPropertyValue {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  return property["@value"].value["@value"];
}
