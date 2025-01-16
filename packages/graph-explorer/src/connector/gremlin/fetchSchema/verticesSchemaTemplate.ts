import { query } from "@/utils";
import { uniq } from "lodash";

/**
 * Given a set of nodes labels, it returns a Gremlin template that contains
 * one sample of each node label.
 *
 * @example
 * types = ["airport", "country"]
 *
 * g.V()
 *   .union(
 *     __.hasLabel("airport").limit(1),
 *     __.hasLabel("country").limit(1)
 *   )
 *   .fold()
 *   .project(
 *     "airport", "country"
 *   )
 *   .by(unfold().hasLabel("airport"))
 *   .by(unfold().hasLabel("country"))
 */
export default function verticesSchemaTemplate({ types }: { types: string[] }) {
  // Labels with quotes
  const labels = uniq(types.flatMap(type => type.split("::"))).map(
    label => `"${label}"`
  );

  return query`
    g.V()
      .union(
        ${labels.map(label => `__.hasLabel(${label}).limit(1)`).join(",\n        ")}
      )
      .fold()
      .project(
        ${labels.join(",\n        ")}
      )
      ${labels.map(label => `.by(unfold().hasLabel(${label}))`).join("\n      ")}
    `;
}
