/**
 * Returns an OpenCypher template to get all edge connections between node labels.
 * Each result contains the source node labels (as array), edge type, target node labels (as array), and count.
 *
 * Note: OpenCypher returns labels as arrays, so the response parsing must
 * handle this by creating edge connections for each label combination.
 */
const edgeConnectionsTemplate = () => {
  return `MATCH (source)-[edge]->(target)
RETURN labels(source) AS sourceLabels,
       type(edge) AS edgeType,
       labels(target) AS targetLabels,
       count(*) AS count`;
};

export default edgeConnectionsTemplate;
