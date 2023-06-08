/**
 * It returns an OpenCypher template to get all edges labels and their counts
 */
const edgeLabelsTemplate = () => {
    return "MATCH ()-[e]-() RETURN type(e) AS label, count(*) AS count";
  };
  
export default edgeLabelsTemplate;
  