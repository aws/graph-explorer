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
import { fragment } from "../fragments";

const edgesSchemaTemplate = ({ type }: { type: string }) => {
  return `MATCH () -[e:${fragment.identifier(type)}]- () RETURN e AS object LIMIT 1`;
};

export default edgesSchemaTemplate;
