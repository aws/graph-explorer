
/**
 * Given an edge type, it returns an OpenCypher template that contains
 * one sample of the edge.
 *
 * @example
 * type = "route"
 * 
 * MATCH() -[e:`route`]- () 
 * RETURN e AS object 
 * LIMIT 1`
 */
const edgesSchemaTemplate = ({ type }: { type: string }) => {
  return `MATCH() -[e:\`${type}\`]- () RETURN e AS object LIMIT 1`;
};

export default edgesSchemaTemplate;
