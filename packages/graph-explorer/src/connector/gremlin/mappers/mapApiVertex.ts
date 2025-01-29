import { createVertexId, type Vertex } from "@/core";
import type { GVertex } from "../types";
import parsePropertiesValues from "./parsePropertiesValues";
import { extractRawId } from "./extractRawId";

const mapApiVertex = (apiVertex: GVertex): Vertex => {
  const labels = apiVertex["@value"].label.split("::");
  const vt = labels[0];
  const isFragment = apiVertex["@value"].properties == null;

  return {
    entityType: "vertex",
    id: createVertexId(extractRawId(apiVertex["@value"].id)),
    type: vt,
    types: labels,
    attributes: parsePropertiesValues(apiVertex["@value"].properties ?? {}),
    __isFragment: isFragment,
  };
};

export default mapApiVertex;
