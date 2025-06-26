import parseProperty from "./parseProperty";
import type { GProperty } from "../types";
import { EntityProperties } from "@/core";

export default function parseEdgePropertiesValues(
  properties?: Record<string, GProperty>
): EntityProperties {
  const parsedProps: EntityProperties = {};
  Object.values(properties || {}).forEach(property => {
    parsedProps[property["@value"].key] = parseProperty(property);
  });

  return parsedProps;
}
