import parseProperty from "./parseProperty";
import type { GVertexProperty } from "../types";

const parsePropertiesValues = (
  properties: Record<string, GVertexProperty[]>
): Record<string, string | number> => {
  const parsedProps: Record<string, string | number> = {};
  Object.values(properties || {}).forEach(propertyArr => {
    parsedProps[propertyArr[0]["@value"].label] = parseProperty(propertyArr[0]);
  });

  return parsedProps;
};

export default parsePropertiesValues;
