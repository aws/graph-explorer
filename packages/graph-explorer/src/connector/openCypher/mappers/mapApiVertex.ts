import type { Vertex } from "../../../@types/entities";
import type { OCVertex } from "../types";

export default function mapApiVertex(apiVertex: OCVertex): Vertex {
  const labels = apiVertex["~labels"];
  const vt = labels[0];

  return {
    data: {
      id: apiVertex["~id"],
      idType: "string",
      type: vt,
      types: labels,
      attributes: apiVertex["~properties"],
    },
  };
}
