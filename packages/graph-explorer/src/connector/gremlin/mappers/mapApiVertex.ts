import type { GVertex } from "../types";

import { createResultVertex } from "../../entities";
import { extractRawId } from "./extractRawId";
import parsePropertiesValues from "./parsePropertiesValues";

export default function mapApiVertex(apiVertex: GVertex, name?: string) {
  // Split multi-label from Neptune and filter out empty strings
  const types = apiVertex["@value"].label.split("::").filter(Boolean);

  // If the properties are null then the vertex is a fragment
  const attributes = apiVertex["@value"].properties
    ? parsePropertiesValues(apiVertex["@value"].properties)
    : undefined;

  return createResultVertex({
    id: extractRawId(apiVertex["@value"].id),
    name,
    types,
    attributes,
  });
}
