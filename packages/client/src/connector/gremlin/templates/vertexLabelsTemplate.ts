/**
 * It returns a Gremlin template to get all nodes labels and their counts
 */
const vertexLabelsTemplate = () => {
  return "g.V().groupCount().by(label)";
};

export default vertexLabelsTemplate;
