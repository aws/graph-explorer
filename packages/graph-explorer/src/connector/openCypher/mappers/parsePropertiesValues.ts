/*import parseProperty from "./parseProperty";

const parsePropertiesValues = (
  properties: Record<string, string[]>
): Record<string, string | number> => {
  const parsedProps: Record<string, string | number> = {};
  Object.values(properties || {}).forEach(propertyArr => {
    parsedProps[propertyArr[0]["@value"].label] = parseProperty(propertyArr[0]);
  });

  return parsedProps;
};

export default parsePropertiesValues;*/
