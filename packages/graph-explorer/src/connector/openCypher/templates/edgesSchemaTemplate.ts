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
 * 
 * WITH ["route", "contain"] AS types
UNWIND types AS label
MATCH ()-[e:`${label}`]->()
LIMIT 1
RETURN e
 */
const edgesSchemaTemplate = ({ types }: { types: string[] }) => {
  const labels = uniq(types.flatMap(type => type.split("::")));
 
  return `WITH [${labels.join(",")}] AS types UNWIND types AS label MATCH ()-[e:label]->() LIMIT 1 RETURN e`
};

export default edgesSchemaTemplate;
