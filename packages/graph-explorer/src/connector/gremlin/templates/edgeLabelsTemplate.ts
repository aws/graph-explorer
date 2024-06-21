/**
 * It returns a Gremlin template to get all edges labels and their counts
 */
export default function edgeLabelsTemplate() {
  return "g.E().groupCount().by(label)";
}
