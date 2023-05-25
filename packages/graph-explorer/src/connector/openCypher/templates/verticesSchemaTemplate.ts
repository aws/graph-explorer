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
const verticesSchemaTemplate = ({ type }: { type: string }) => {
  return `MATCH(v:\`${type}\`) RETURN v AS object LIMIT 1`;
};

export default verticesSchemaTemplate;
