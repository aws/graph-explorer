/**
 * It returns a Gremlin template to number of vertices of a particular label
 */
export default function vertexTypeCountTemplate(label: string) {
  return `g.V().hasLabel("${label}").count()`;
}
