import { createResultScalar, type ResultScalar } from "@/connector/entities";
import type { DisplayAttribute, DisplayEdge } from "@/core";
import { useTranslations } from "@/hooks";

/**
 * Create scalars for the given edge's ID, label, and attributes.
 * @param edge The edge to create the scalars for
 * @returns A list of scalars for the edge's ID, label, and attributes
 */
export function useEdgeAttributesAsScalars(edge: DisplayEdge) {
  const t = useTranslations();

  const idScalar = edge.hasUniqueId
    ? createResultScalar({ name: "ID", value: edge.displayId })
    : null;

  const labelScalar = createResultScalar({
    name: t("edges-styling.edge-type"),
    value: edge.displayTypes,
  });

  const attributes = edge.attributes.map((attribute: DisplayAttribute) =>
    createResultScalar({
      name: attribute.displayLabel,
      value: attribute.displayValue,
    })
  );

  const allAttributes: ResultScalar[] = [
    ...(idScalar != null ? [idScalar] : []),
    labelScalar,
    ...attributes,
  ];

  return allAttributes;
}
