/**
 * It returns a Gremlin template to number of vertices of a particular label
 */
const vertexTypeCountTemplate = (label: string) => {
  return `g.V().hasLabel("${label}").count()`;
};

export default vertexTypeCountTemplate;
