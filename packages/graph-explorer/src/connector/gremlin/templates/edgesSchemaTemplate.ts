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
const edgesSchemaTemplate = ({ types }: { types: string[] }) => {
  const labels = uniq(types.flatMap(type => type.split("::")));

  return `g.E().project(${labels.map(l => `"${l}"`).join(",")})${labels.map(l => `.by(V().bothE("${l}").limit(1))`).join("")}.limit(1)`;
};

export default edgesSchemaTemplate;
