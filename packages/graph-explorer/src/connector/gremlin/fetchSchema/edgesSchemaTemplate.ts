import { uniq } from "lodash";

import { query } from "@/utils";

/**
 * Given a set of edge types, it returns a Gremlin template that contains
 * one sample of each edge type.
 *
 * Uses g.V().limit(1) as a dummy anchor because each .by() modulator runs an
 * independent global V() sub-traversal that doesn't depend on the anchor value.
 * This also avoids Neptune DFE falling back to non-native execution for g.E().
 *
 * @example
 * edgesSchemaTemplate({ types: ["route", "contain"] })
 * // Returns:
 * // g.V().limit(1)
 * //   .project(
 * //     "route",
 * //     "contain"
 * //   )
 * //   .by(V().bothE("route").limit(1))
 * //   .by(V().bothE("contain").limit(1))
 */
export default function edgesSchemaTemplate({ types }: { types: string[] }) {
  const labels = uniq(types.flatMap(type => type.split("::"))).map(
    label => `"${label}"`,
  );

  return query`
    g.V().limit(1)
      .project(
        ${labels.join(",\n        ")}
      )
      ${labels.map(label => `.by(V().bothE(${label}).limit(1))`).join("\n      ")}
  `;
}
