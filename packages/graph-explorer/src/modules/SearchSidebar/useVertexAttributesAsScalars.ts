import { createResultScalar } from "@/connector/entities";
import { DisplayVertex, useQueryEngine, DisplayAttribute } from "@/core";
/**
 * Creates scalars for the given vertex's ID, label, and attributes.
 * @param vertex The vertex to create scalars for.
 * @returns The scalars for the given vertex.
 */
export function useVertexAttributesAsScalars(vertex: DisplayVertex) {
  const queryEngine = useQueryEngine();
  const isRdf = queryEngine === "sparql";

  // Create the ID scalar
  const idScalar = createResultScalar({
    // Blank nodes will have a non-stable unique ID, so they should be treated differently
    name: isRdf ? (vertex.isBlankNode ? "Blank node ID" : "URI") : "ID",
    value: vertex.displayId,
  });

  // Create the label scalar
  const shouldPluralize = vertex.original.types.length !== 1;
  const labelScalar = createResultScalar({
    name: isRdf
      ? shouldPluralize
        ? "Classes"
        : "Class"
      : shouldPluralize
        ? "Labels"
        : "Label",
    value: vertex.displayTypes,
  });

  // Create the attributes scalars
  const attributes = vertex.attributes.map((attribute: DisplayAttribute) =>
    createResultScalar({
      name: attribute.displayLabel,
      value: attribute.displayValue,
    })
  );

  return [idScalar, labelScalar, ...attributes];
}
