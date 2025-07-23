import { EntityPropertyValue } from "@/core";
import type { GProperty, GVertexProperty } from "../types";
import { MISSING_DISPLAY_VALUE } from "@/utils";

export default function parseProperty(
  property: GVertexProperty | GProperty
): EntityPropertyValue {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  if (typeof property["@value"].value === "boolean") {
    return property["@value"].value;
  }

  if (property["@value"].value === null) {
    return MISSING_DISPLAY_VALUE;
  }

  return property["@value"].value["@value"];
}
