import { createResultScalar } from "@/connector/entities";
import type { DisplayVertex, DisplayAttribute } from "@/core";
import { useTranslations } from "@/hooks";
import { LABELS } from "@/utils";
/**
 * Creates scalars for the given vertex's ID, label, and attributes.
 * @param vertex The vertex to create scalars for.
 * @returns The scalars for the given vertex.
 */
export function useVertexAttributesAsScalars(vertex: DisplayVertex) {
  const t = useTranslations();

  // Create the ID scalar
  const idScalar = createResultScalar({
    // Blank node IDs are not standard IDs, so they get a custom label
    name: vertex.isBlankNode ? LABELS.BLANK_NODE_ID : t("node-detail.node-id"),
    value: vertex.displayId,
  });

  // Create the label scalar
  const labelScalar =
    vertex.displayTypes !== LABELS.MISSING_TYPE
      ? [
          createResultScalar({
            name: t("node-detail.node-type"),
            value: vertex.displayTypes,
          }),
        ]
      : [];

  // Create the attributes scalars
  const attributes = vertex.attributes.map((attribute: DisplayAttribute) =>
    createResultScalar({
      name: attribute.displayLabel,
      value: attribute.displayValue,
    })
  );

  return [idScalar, ...labelScalar, ...attributes];
}
