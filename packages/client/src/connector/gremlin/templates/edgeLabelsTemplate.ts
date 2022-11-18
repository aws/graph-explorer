/**
 * It returns a Gremlin template to get all edges labels and their counts
 */
const edgeLabelsTemplate = () => {
  return "g.E().groupCount().by(label)";
};

export default edgeLabelsTemplate;
