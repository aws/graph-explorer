import { createVertex } from "@/core";
import type { GVertex } from "../types";
import parsePropertiesValues from "./parsePropertiesValues";
import { extractRawId } from "./extractRawId";

const mapApiVertex = (apiVertex: GVertex) => {
  // Split multi-label from Neptune and filter out empty strings
  const types = apiVertex["@value"].label.split("::").filter(Boolean);

  // If the properties are null then the vertex is a fragment
  const attributes = apiVertex["@value"].properties
    ? parsePropertiesValues(apiVertex["@value"].properties)
    : undefined;

  return createVertex({
    id: extractRawId(apiVertex["@value"].id),
    types,
    attributes,
  });
};

export default mapApiVertex;
