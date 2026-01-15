import { formatDate, LABELS } from "@/utils";

/**
 * Represents a scalar value that can be returned from a graph database query.
 *
 * Scalar values are primitive data types that are not vertices or edges,
 * such as strings, numbers, booleans, dates, or null values.
 */
export type ScalarValue = string | number | boolean | Date | null;

/**
 * A scalar result from a graph database query.
 *
 * This represents primitive values returned from queries, such as property
 * values, computed results, or literal values from the database.
 */
export type ResultScalar = {
  /**
   * Indicates the type in order to discriminate from other result types in
   * unions.
   */
  entityType: "scalar";

  /** The name of the scalar in the original result set, if available */
  name?: string;

  /** The actual scalar value */
  value: ScalarValue;
};

/**
 * Constructs a ResultScalar instance from the given values.
 *
 * @param value - The scalar value to wrap
 * @param name - Optional name for the scalar in the result set
 * @returns A new ResultScalar instance
 */
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

/**
 * Determines the type of the value and casts it to a typed object.
 *
 * This function analyzes a scalar value and returns an object with both
 * the detected type and the value. Falls back to string if the type
 * cannot be determined.
 *
 * @param value - The scalar value to analyze
 * @returns An object with the detected type and the value
 */
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

/**
 * Formats a scalar value for display in the UI.
 *
 * This function takes a scalar value and returns a human-readable string
 * representation based on the value's type:
 * - Strings: returned as-is
 * - Numbers: formatted using locale-specific number formatting
 * - Booleans: converted to string representation
 * - Dates: formatted using the application's date formatter
 * - Null: returns a placeholder for missing values
 *
 * @param value - The scalar value to format
 * @returns A formatted string suitable for display
 */
export function getDisplayValueForScalar(value: ScalarValue) {
  const typedValue = createTypedValue(value);
  switch (typedValue.type) {
    case "string":
      // Check for empty string
      return !typedValue.value.trim() ? LABELS.EMPTY_VALUE : typedValue.value;
    case "number":
      return formatNumber(typedValue.value);
    case "boolean":
      return String(typedValue.value);
    case "date":
      return formatDate(typedValue.value);
    case "null":
      return LABELS.MISSING_VALUE;
  }
}

/**
 * Formats a number for display using locale-specific formatting.
 *
 * Uses scientific notation for very small (< 0.001) or very large (> 1e9)
 * numbers to improve readability. Otherwise, uses standard decimal formatting
 * with up to 4 fraction digits. Zero is always formatted without scientific
 * notation.
 *
 * @param value - The number to format
 * @returns A formatted string representation of the number
 *
 * @example
 * formatNumber(1234.5678)    // "1,234.5678" (locale-dependent)
 * formatNumber(0.0001)       // "1E-4" (scientific notation)
 * formatNumber(1e10)         // "1E10" (scientific notation)
 * formatNumber(0)            // "0"
 */
function formatNumber(value: number) {
  if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) > 1e9)) {
    return new Intl.NumberFormat(undefined, {
      notation: "scientific",
      maximumSignificantDigits: 4,
    }).format(value);
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);
}
