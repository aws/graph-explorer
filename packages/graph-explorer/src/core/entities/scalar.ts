import { formatDate, MISSING_DISPLAY_VALUE } from "@/utils";

export type ScalarValue = string | number | boolean | Date | null;

export type ResultScalar = {
  entityType: "scalar";
  name?: string;
  value: ScalarValue;
};

/** Constructs a ResultScalar instance from the given values. */
export function createResultScalar({
  value,
  name,
}: {
  value: ScalarValue;
  name?: string;
}): ResultScalar {
  return {
    entityType: "scalar" as const,
    name,
    value,
  };
}

/** Determines the type of the value and casts it. Falls back to string if the type can not be determined. */
export function createTypedValue(value: ScalarValue) {
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

export function getDisplayValueForScalar(value: ScalarValue) {
  const typedValue = createTypedValue(value);
  switch (typedValue.type) {
    case "string":
      return typedValue.value;
    case "number":
      return new Intl.NumberFormat().format(typedValue.value);
    case "boolean":
      return String(typedValue.value);
    case "date":
      return formatDate(typedValue.value);
    case "null":
      return MISSING_DISPLAY_VALUE;
  }
}
