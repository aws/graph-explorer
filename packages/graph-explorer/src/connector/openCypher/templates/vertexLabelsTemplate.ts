/**
 * It returns an OpenCypher template to get all nodes labels and their counts
 */
const vertexLabelsTemplate = () => {
    return "MATCH (v) RETURN labels(v) AS label, count(v) AS count"
};
  
export default vertexLabelsTemplate;
  