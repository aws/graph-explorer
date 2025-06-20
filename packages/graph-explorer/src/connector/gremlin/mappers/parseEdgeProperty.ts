import type { GProperty } from "../types";

const parseEdgeProperty = (property: GProperty): string | number => {
  if (typeof property["@value"].value === "string") {
    return property["@value"].value;
  }

  if (typeof property["@value"].value === "boolean") {
    return String(property["@value"].value);
  }

  return property["@value"].value["@value"];
};

export default parseEdgeProperty;
