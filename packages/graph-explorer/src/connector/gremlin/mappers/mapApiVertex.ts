import type { Vertex } from "../../../@types/entities";
import type { GVertex } from "../types";
import { detectIdType } from "./detectIdType";
import parsePropertiesValues from "./parsePropertiesValues";
import toStringId from "./toStringId";

export default function mapApiVertex(apiVertex: GVertex): Vertex {
  const labels = apiVertex["@value"].label.split("::");
  const vt = labels[0];

  return {
    data: {
      id: toStringId(apiVertex["@value"].id),
      idType: detectIdType(apiVertex["@value"].id),
      type: vt,
      types: labels,
      attributes: parsePropertiesValues(apiVertex["@value"].properties),
    },
  };
}
