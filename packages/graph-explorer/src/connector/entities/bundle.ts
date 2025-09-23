import { getDisplayValueForScalar } from "./scalar";
import { PatchedResultEntity, ResultEntity } from "./entities";
import { NBSP } from "@/utils";
import { TextTransformer } from "@/hooks";

/**
 * Represents a collection of values. This can be vertices, edges, or just a
 * list of scalar values like an array or a map. It can also include other
 * bundles.
 */
export type ResultBundle = {
  /**
   * Indicates the type in order to discriminate from other result types in
   * unions.
   */
  entityType: "bundle";

  /**
   * The name of the bundle in the original result set.
   */
  name?: string;

  /**
   * The values contained in the bundle.
   */
  values: ResultEntity[];
};

/**
 * A `ResultBundle` where all the values have been fully patched.
 */
export type PatchedResultBundle = Omit<ResultBundle, "values"> & {
  values: PatchedResultEntity[];
};

/**
 * Constructs a ResultBundle instance from the given name and values.
 *
 * @param name - Optional name for the bundle in the result set
 * @param values - Array of result entities to include in the bundle
 * @returns A new ResultBundle instance
 */
export function createResultBundle({
  name,
  values,
}: {
  name?: string;
  values: ResultEntity[];
}): ResultBundle {
  return {
    entityType: "bundle" as const,
    name,
    values,
  };
}

/**
 * Constructs a PatchedResultBundle instance from the given name and values.
 *
 * @param name - Optional name for the bundle in the result set
 * @param values - Array of patched result entities to include in the bundle
 * @returns A new PatchedResultBundle instance
 */
export function createPatchedResultBundle({
  name,
  values,
}: {
  name?: string;
  values: PatchedResultEntity[];
}): PatchedResultBundle {
  return {
    entityType: "bundle" as const,
    name,
    values,
  };
}

/**
 * Combines bundle values into a single display string.
 *
 * Each value is formatted according to its type:
 * - Scalars: "name: value" or just "value" if no name
 * - Vertices: "name: v(id)" or just "v(id)" if no name
 * - Edges: "name: e(id)" or just "e(id)" if no name
 * - Bundles: "name: [...]" or just "[...]" if no name
 *
 * @param bundle - The bundle to format
 * @returns A formatted string with values separated by " • " (non-breaking
 * space + bullet)
 *
 * @example
 * ```typescript
 * const bundle = createBundle({
 *   name: "UserInfo",
 *   values: [
 *     { entityType: "scalar", name: "Name", value: "John" },
 *     { entityType: "scalar", name: "Age", value: 25 },
 *     { entityType: "vertex", name: "Profile", id: "v123" }
 *   ]
 * });
 *
 * getDisplayValueForBundle(bundle);
 * // Returns: "Name: John • Age: 25 • Profile: v(v123)"
 * ```
 */
export function getDisplayValueForBundle(
  bundle: PatchedResultBundle,
  textTransformer?: TextTransformer
): string {
  const transform = textTransformer ?? (text => text);
  return bundle.values
    .map(entity => {
      switch (entity.entityType) {
        case "scalar":
          return entity.name != null
            ? `${transform(entity.name)}: ${transform(getDisplayValueForScalar(entity.value))}`
            : transform(getDisplayValueForScalar(entity.value));
        case "patched-vertex":
          return entity.name
            ? `${entity.name}: v(${entity.id})`
            : `v(${entity.id})`;
        case "patched-edge":
          return entity.name
            ? `${entity.name}: e(${entity.id})`
            : `e(${entity.id})`;
        case "bundle":
          return entity.name != null
            ? `${transform(entity.name)}: [...]`
            : `[...]`;
      }
    })
    .join(`${NBSP}• `);
}
