import type { GVertexProperty } from "../types";

const parseProperty = (property: GVertexProperty): string | number => {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  return property["@value"].value["@value"];
};

export default parseProperty;
