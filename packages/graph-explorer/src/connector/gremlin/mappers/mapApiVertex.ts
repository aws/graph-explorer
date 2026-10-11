import type { GVertex } from "../types";

import { createResultVertex } from "../../entities";
import { splitLabel } from "../splitLabel";
import { extractRawId } from "./extractRawId";
import parsePropertiesValues from "./parsePropertiesValues";

export default function mapApiVertex(apiVertex: GVertex, name?: string) {
  // An empty label means the vertex has no labels, not a label to split.
  const label = apiVertex["@value"].label;
  const types = label === "" ? [] : splitLabel(label);

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
