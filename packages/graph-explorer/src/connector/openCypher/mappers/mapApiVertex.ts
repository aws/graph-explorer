import type { OCVertex } from "../types";
import { mapApiProperties } from "./mapApiProperties";
import { createResultVertex } from "@/connector/entities";

export default function mapApiVertex(apiVertex: OCVertex, name?: string) {
  const labels = apiVertex["~labels"];

  return createResultVertex({
    id: apiVertex["~id"],
    name,
    types: labels,
    attributes: mapApiProperties(apiVertex["~properties"]),
  });
}
