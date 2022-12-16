import parseEdgeProperty from "./parseEdgeProperty";
import type { GProperty } from "../types";

const parseEdgePropertiesValues = (
  properties?: Record<string, GProperty>
): Record<string, string | number> => {
  const parsedProps: Record<string, string | number> = {};
  Object.values(properties || {}).forEach(property => {
    parsedProps[property["@value"].key] = parseEdgeProperty(property);
  });

  return parsedProps;
};

export default parseEdgePropertiesValues;
