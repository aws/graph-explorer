import { uniq } from "lodash";

import type { QueryFragment } from "@/connector/queryFragment";

import { joinFragments, query } from "@/utils";

import { fragment } from "../fragments";
import { splitLabel } from "../splitLabel";

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
export default function edgesSchemaTemplate({
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
        labels.map(label => query`.by(V().bothE(${label}).limit(1))`),
        "\n      ",
      )}
  `;
}
