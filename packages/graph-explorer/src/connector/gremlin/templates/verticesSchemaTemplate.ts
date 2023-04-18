import { uniq } from "lodash";

/**
 * Given a set of nodes labels, it returns a Gremlin template that contains
 * one sample of each node label.
 *
 * @example
 * types = ["route", "contain"]
 *
 * g.V()
 *  .project("airport","country")
 *  .by(V().hasLabel("airport").limit(1))
 *  .by(V().hasLabel("country").limit(1))
 *  .limit(1)
 */
const verticesSchemaTemplate = ({ types }: { types: string[] }) => {
  const labels = uniq(types.flatMap(type => type.split("::")));

  return `g.V().project(${labels.map(l => `"${l}"`).join(",")})${labels.map(l => `.by(V().hasLabel("${l}").limit(1))`).join("")}.limit(1)`;
};

export default verticesSchemaTemplate;
