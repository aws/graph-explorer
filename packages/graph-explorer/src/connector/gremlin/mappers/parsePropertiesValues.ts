import type { EntityProperties } from "@/core";

import type { GVertexProperty } from "../types";

import parseProperty from "./parseProperty";

export default function parsePropertiesValues(
  properties: Record<string, GVertexProperty[]>,
): EntityProperties {
  const parsedProps: EntityProperties = {};
  Object.values(properties || {}).forEach(propertyArr => {
    parsedProps[propertyArr[0]["@value"].label] = parseProperty(propertyArr[0]);
  });

  return parsedProps;
}
