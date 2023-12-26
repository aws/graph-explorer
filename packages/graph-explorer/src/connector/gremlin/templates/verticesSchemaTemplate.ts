import { uniq } from "lodash";

/**
 * Given a set of nodes labels, it returns a Gremlin template that contains
 * one sample of each node label.
 *
 * @example
 * types = ["route", "contain"]
 *
 * g.V()
 *  .union(
 *    __.hasLabel("airport").limit(1),
 *    __.hasLabel("country").limit(1)
 *  )
 *  .fold()
 *  .project("airport","country")
 *  .by(unfold().hasLabel("airport"))
 *  .by(unfold().hasLabel("country"))
 */
const verticesSchemaTemplate = ({ types }: { types: string[] }) => {
  const labels = uniq(types.flatMap(type => type.split("::")));

  return `g.V().union(${labels.map(l => `__.hasLabel("${l}").limit(1)`).join(",")}).fold().project(${labels.map(l => `"${l}"`).join(",")})${labels.map(l => `.by(unfold().hasLabel("${l}"))`).join("")}`;
};

export default verticesSchemaTemplate;
