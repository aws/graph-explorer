import { uniq } from "lodash";

import type { QueryFragment } from "@/connector/queryFragment";

import { joinFragments, query } from "@/utils";

import { fragment } from "../fragments";
import { splitLabel } from "../splitLabel";

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
export default function verticesSchemaTemplate({
  types,
}: {
  types: string[];
}): QueryFragment {
  const labels = uniq(types.flatMap(splitLabel)).map(fragment.identifier);

  return query`
    g.V().limit(1)
      .project(
        ${joinFragments(labels, ",\n        ")}
      )
      ${joinFragments(
        labels.map(label => query`.by(V().hasLabel(${label}).limit(1))`),
        "\n      ",
      )}
  `;
}
