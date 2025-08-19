import { createResultScalar } from "@/connector/entities";
import { type DisplayAttribute, useQueryEngine } from "@/core";

/**
 * Converts the attributes to a list of scalars. If there are no attributes, a
 * scalar with the label "No attributes" is returned.
 *
 * @param attributes The attributes to convert
 */
export function useEntityAttributesAsScalars(attributes: DisplayAttribute[]) {
  const queryEngine = useQueryEngine();
  const noAttributesLabel =
    queryEngine === "sparql" ? "No predicates" : "No attributes";

  return attributes.length > 0
    ? attributes.map(a =>
        createResultScalar({ name: a.displayLabel, value: a.displayValue })
      )
    : [createResultScalar({ value: noAttributesLabel })];
}
