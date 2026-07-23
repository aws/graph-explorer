import type { EntityPropertyValue } from "@/core";

import type { EdgeType, VertexType } from "../entities";
import type { StyleCondition } from "./graphStyles";

/**
 * The Cytoscape data key stamped as `"true"` on a rendered entity when its
 * type's styling condition is satisfied. The conditional selector matches on
 * this flag, so the comparison itself is done here in JavaScript rather than by
 * Cytoscape's attribute-selector operators — which compare lexicographically or
 * via `parseFloat` and therefore mishandle dates and mixed types.
 */
export const CONDITION_MET_DATA_KEY = "conditionMet";

/** A compact, human-readable summary of a condition, e.g. `create_date > 2025-03-03`. */
export function formatStyleCondition(condition: StyleCondition): string {
  return `${condition.attribute} ${condition.operator} ${condition.value}`;
}

/**
 * Evaluates whether a rendered entity's attribute value satisfies the styling
 * condition. A missing value never matches. Ordering operators compare
 * numerically when both sides are numbers, chronologically when both parse as
 * dates, and lexicographically otherwise, so `create_date > "2025-03-03"`
 * behaves correctly regardless of the date's stored format.
 */
export function evaluateStyleCondition(
  rawValue: EntityPropertyValue | undefined,
  condition: StyleCondition,
): boolean {
  if (rawValue === undefined || rawValue === null) {
    return false;
  }

  switch (condition.operator) {
    case "=":
      return valuesEqual(rawValue, condition.value);
    case "!=":
      return !valuesEqual(rawValue, condition.value);
    case ">":
      return compareValues(rawValue, condition.value) > 0;
    case "<":
      return compareValues(rawValue, condition.value) < 0;
    case ">=":
      return compareValues(rawValue, condition.value) >= 0;
    case "<=":
      return compareValues(rawValue, condition.value) <= 0;
  }
}

function valuesEqual(rawValue: EntityPropertyValue, value: string): boolean {
  if (String(rawValue) === value) {
    return true;
  }
  const rawNumber = Number(rawValue);
  const valueNumber = Number(value);
  return (
    Number.isFinite(rawNumber) &&
    Number.isFinite(valueNumber) &&
    rawNumber === valueNumber
  );
}

/**
 * Returns a negative, zero, or positive number when `rawValue` orders before,
 * equal to, or after `value`. Prefers numeric comparison, then chronological
 * (date) comparison, then lexicographic — so each type compares meaningfully.
 */
function compareValues(rawValue: EntityPropertyValue, value: string): number {
  const rawNumber = Number(rawValue);
  const valueNumber = Number(value);
  if (Number.isFinite(rawNumber) && Number.isFinite(valueNumber)) {
    return rawNumber - valueNumber;
  }

  const rawDate = Date.parse(String(rawValue));
  const valueDate = Date.parse(value);
  if (!Number.isNaN(rawDate) && !Number.isNaN(valueDate)) {
    return rawDate - valueDate;
  }

  const rawString = String(rawValue);
  return rawString < value ? -1 : rawString > value ? 1 : 0;
}

/**
 * The Cytoscape selector for a vertex type whose condition is met. The match is
 * driven by the {@link CONDITION_MET_DATA_KEY} flag stamped during rendering.
 */
export function buildConditionalNodeSelector(type: VertexType): string {
  return `node[type="${type}"][${CONDITION_MET_DATA_KEY} = "true"]`;
}

/** The Cytoscape selector for an edge type whose condition is met. */
export function buildConditionalEdgeSelector(type: EdgeType): string {
  return `edge[type="${type}"][${CONDITION_MET_DATA_KEY} = "true"]`;
}
