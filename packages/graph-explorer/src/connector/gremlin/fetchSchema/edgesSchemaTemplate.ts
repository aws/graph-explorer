import { uniq } from "lodash";

import { query } from "@/utils";

import { fragment } from "../fragments";

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
 * //     'route',
 * //     'contain'
 * //   )
 * //   .by(V().bothE('route').limit(1))
 * //   .by(V().bothE('contain').limit(1))
 */
export default function edgesSchemaTemplate({ types }: { types: string[] }) {
  // Empty segments are dropped rather than reported: a label like `route::`
  // reaches this template from the database, where there is no user to show an
  // error to, so schema discovery degrades instead of failing outright.
  const labels = uniq(
    types.flatMap(type => type.split("::")).filter(Boolean),
  ).map(type => fragment.identifier(type));

  return query`
    g.V().limit(1)
      .project(
        ${labels.join(",\n        ")}
      )
      ${labels.map(label => `.by(V().bothE(${label}).limit(1))`).join("\n      ")}
  `;
}
