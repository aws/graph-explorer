/**
 * It returns an OpenCypher template to count the number of vertices of a particular label
 */
const vertexTypeCountTemplate = (label: string) => {
    return `MATCH (v:\`${label}\`) RETURN count(v) AS count`;
  };
  
  export default vertexTypeCountTemplate;
  