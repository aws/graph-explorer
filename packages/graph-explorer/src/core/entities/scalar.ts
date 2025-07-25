import { EntityPropertyValue } from "./shared";

type ScalarTypedValue =
  | { type: "null"; value: null }
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "date"; value: Date };

export type Scalar = {
  entityType: "scalar";
} & ScalarTypedValue;

/** Constructs a Scalar instance from the given values. */
export function createScalar(value: EntityPropertyValue | Date | null): Scalar {
  return {
    entityType: "scalar" as const,
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
