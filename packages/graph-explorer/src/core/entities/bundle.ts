import { getDisplayValueForScalar } from "./scalar";
import { PatchedResultEntity, ResultEntity } from "./entities";
import { NBSP } from "@/utils";

export type ResultBundle = {
  entityType: "bundle";
  name?: string;
  values: ResultEntity[];
};

export type PatchedResultBundle = Omit<ResultBundle, "values"> & {
  values: PatchedResultEntity[];
};

/** Constructs a Bundle instance from the given name and values. */
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
 * @returns A formatted string with values separated by " • " (non-breaking space + bullet)
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
  bundle: ResultBundle | PatchedResultBundle
): string {
  return bundle.values
    .map(entity => {
      if (entity.entityType === "scalar") {
        return entity.name != null
          ? `${entity.name}: ${getDisplayValueForScalar(entity.value)}`
          : getDisplayValueForScalar(entity.value);
      } else if (entity.entityType === "vertex") {
        return entity.name
          ? `${entity.name}: v(${entity.id})`
          : `v(${entity.id})`;
      } else if (entity.entityType === "edge") {
        return entity.name
          ? `${entity.name}: e(${entity.id})`
          : `e(${entity.id})`;
      } else if (entity.entityType === "bundle") {
        return entity.name != null ? `${entity.name}: [...]` : `[...]`;
      }
      return null;
    })
    .filter(Boolean)
    .join(`${NBSP}• `);
}
