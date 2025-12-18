/**
 * Returns a Gremlin template to get all edge connections between node labels.
 * Each result contains the source node label, edge type, and target node label.
 *
 * Note: In Neptune Gremlin, multiple labels are stored as a single string
 * separated by `::`. The response parsing must handle this by splitting
 * labels and creating edge connections for each label combination.
 */
export default function edgeConnectionsTemplate() {
  return `g.E().groupCount().by(
    project('source', 'edge', 'target')
      .by(outV().label())
      .by(label())
      .by(inV().label())
  )`;
}
