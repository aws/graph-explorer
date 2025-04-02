import { createVertex } from "@/core";
import type { OCVertex } from "../types";

export default function mapApiVertex(apiVertex: OCVertex) {
  const labels = apiVertex["~labels"];

  return createVertex({
    id: apiVertex["~id"],
    types: labels,
    attributes: apiVertex["~properties"],
  });
}
