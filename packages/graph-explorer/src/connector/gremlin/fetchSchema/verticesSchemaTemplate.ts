import { uniq } from "lodash";

import { query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Given a set of nodes labels, it returns a Gremlin template that contains
 * one sample of each node label.
 *
 * Uses g.V().limit(1) as a dummy anchor because each .by() modulator runs an
 * independent global V() sub-traversal that doesn't depend on the anchor value.
 * This also avoids Neptune DFE falling back to non-native execution.
 *
 * @example
 * verticesSchemaTemplate({ types: ["airport", "country"] })
 * // Returns:
 * // g.V().limit(1)
 * //   .project(
 * //     'airport',
 * //     'country'
 * //   )
 * //   .by(V().hasLabel('airport').limit(1))
 * //   .by(V().hasLabel('country').limit(1))
 */
export default function verticesSchemaTemplate({ types }: { types: string[] }) {
  // Empty segments are dropped rather than reported: a label like `air::`
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
      ${labels.map(label => `.by(V().hasLabel(${label}).limit(1))`).join("\n      ")}
  `;
}
