import type { EntityPropertyValue } from "@/core";

import { parseDate } from "@/connector/entities";

import type { GProperty, GVertexProperty } from "../types";

export default function parseProperty(
  property: GVertexProperty | GProperty,
): EntityPropertyValue {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  if (typeof property["@value"].value === "boolean") {
    return property["@value"].value;
  }

  if (property["@value"].value["@type"] === "g:Date") {
    return parseDate(property["@value"].value["@value"]);
  }

  return property["@value"].value["@value"];
}
