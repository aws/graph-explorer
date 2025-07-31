import { formatDate, MISSING_DISPLAY_VALUE } from "@/utils";
import { EntityPropertyValue } from "./shared";

type ScalarTypedValue =
  | { type: "null"; value: null }
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "date"; value: Date };

export type Scalar = {
  entityType: "scalar";
  name?: string;
} & ScalarTypedValue;

/** Constructs a Scalar instance from the given values. */
export function createScalar({
  value,
  name,
}: {
  value: EntityPropertyValue | Date | null;
  name?: string;
}): Scalar {
  return {
    entityType: "scalar" as const,
    name,
    ...createTypedValue(value),
  };
}

function createTypedValue(
  value: EntityPropertyValue | Date | null
): ScalarTypedValue {
  if (value === null) {
    return { type: "null" as const, value: null };
  } else if (value instanceof Date) {
    return { type: "date" as const, value };
  } else if (typeof value === "string") {
    return { type: "string" as const, value };
  } else if (typeof value === "number") {
    return { type: "number" as const, value };
  } else if (typeof value === "boolean") {
    return { type: "boolean" as const, value };
  } else {
    return { type: "string" as const, value: String(value) };
  }
}

export function getDisplayValueForScalar(scalar: Scalar) {
  switch (scalar.type) {
    case "string":
      return scalar.value;
    case "number":
      return new Intl.NumberFormat().format(scalar.value);
    case "boolean":
      return String(scalar.value);
    case "date":
      return formatDate(scalar.value);
    case "null":
      return MISSING_DISPLAY_VALUE;
  }
}
