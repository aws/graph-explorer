import { query } from "@/utils";
import { uniq } from "lodash";

/**
 * Given a set of edge types, it returns a Gremlin template that contains
 * one sample of each edge type.
 *
 * @example
 * types = ["route", "contain"]
 *
 * g.E()
 *  .project("route","contain")
 *  .by(V().bothE("route").limit(1))
 *  .by(V().bothE("contain").limit(1))
 *  .limit(1)
 */
export default function edgesSchemaTemplate({ types }: { types: string[] }) {
  // Labels with quotes
  const labels = uniq(types.flatMap(type => type.split("::"))).map(
    label => `"${label}"`
  );

  return query`
    g.E()
      .project(${labels.join(", ")})
      ${labels.map(label => `.by(V().bothE(${label}).limit(1))`).join("\n      ")}
      .limit(1)
  `;
}
