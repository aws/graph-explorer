import { fragment } from "../fragments";

/**
 * It returns an OpenCypher template to count the number of vertices of a particular label
 */
const vertexTypeCountTemplate = (label: string) => {
  return `MATCH (v:${fragment.identifier(label)}) RETURN count(v) AS count`;
};

export default vertexTypeCountTemplate;
