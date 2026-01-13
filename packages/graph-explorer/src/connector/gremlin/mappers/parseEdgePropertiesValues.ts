import type { EntityProperties } from "@/core";

import type { GProperty } from "../types";

import parseProperty from "./parseProperty";

export default function parseEdgePropertiesValues(
  properties?: Record<string, GProperty>,
): EntityProperties {
  const parsedProps: EntityProperties = {};
  Object.values(properties || {}).forEach(property => {
    parsedProps[property["@value"].key] = parseProperty(property);
  });

  return parsedProps;
}
