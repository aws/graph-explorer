/**
 * It returns a Gremlin template to get all edges labels and their counts
 */
const edgeLabelsTemplate = () => {
    return "MATCH ()-[e]->() RETURN DISTINCT type(e)";
  };
  
  export default edgeLabelsTemplate;
  