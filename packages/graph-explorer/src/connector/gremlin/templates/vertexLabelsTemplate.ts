/**
 * It returns a Gremlin template to get all nodes labels and their counts
 */
export default function vertexLabelsTemplate() {
  return "g.V().groupCount().by(label)";
}
