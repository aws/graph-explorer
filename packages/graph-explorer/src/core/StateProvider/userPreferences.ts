import type { Simplify } from "type-fest";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { isEqual } from "lodash";
import { useDeferredValue } from "react";

import { RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";

import type { EdgeType, VertexType } from "../entities";

import { useActiveSchema } from "./schema";
import { userStylingAtom } from "./storageAtoms";

export type ShapeStyle =
  | "rectangle"
  | "roundrectangle"
  | "ellipse"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "star"
  | "barrel"
  | "diamond"
  | "vee"
  | "rhomboid"
  | "tag"
  | "round-rectangle"
  | "round-triangle"
  | "round-diamond"
  | "round-pentagon"
  | "round-hexagon"
  | "round-heptagon"
  | "round-octagon"
  | "round-tag"
  | "cut-rectangle"
  | "concave-hexagon";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowStyle =
  | "triangle"
  | "triangle-tee"
  | "circle-triangle"
  | "triangle-cross"
  | "triangle-backcurve"
  | "tee"
  | "vee"
  | "square"
  | "circle"
  | "diamond"
  | "none";

/** The user preferences to be used for the specified vertex type as the type used for storing in local storage. */
export type VertexPreferencesStorageModel = {
  type: VertexType;
  /**
   * Color overwrite for vertex
   */
  color?: string;
  /**
   * Label overwrite for vertex
   */
  displayLabel?: string;
  /**
   * Icon overwrite for vertex
   */
  iconUrl?: string;
  /**
   * Icon overwrite for vertex
   */
  iconImageType?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * Vertex attribute to be used as description
   */
  longDisplayNameAttribute?: string;
  shape?: ShapeStyle;
  backgroundOpacity?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: LineStyle;
};

/** The user preferences to be used for the specified edge type as the type used for storing in local storage. */
export type EdgePreferencesStorageModel = {
  type: EdgeType;
  displayLabel?: string;
  displayNameAttribute?: string;
  labelColor?: string;
  labelBackgroundOpacity?: number;
  labelBorderColor?: string;
  labelBorderStyle?: LineStyle;
  labelBorderWidth?: number;
  lineColor?: string;
  lineThickness?: number;
  lineStyle?: LineStyle;
  sourceArrowStyle?: ArrowStyle;
  targetArrowStyle?: ArrowStyle;
};

/** The user preferences to be used for the specified vertex type as an immutable object. */
export type VertexPreferences = Simplify<
  Readonly<
    Pick<VertexPreferencesStorageModel, "displayLabel"> &
      Required<Omit<VertexPreferencesStorageModel, "displayLabel">>
  >
>;

/** The user preferences to be used for the specified edge type as an immutable object. */
export type EdgePreferences = Simplify<
  Readonly<
    Pick<EdgePreferencesStorageModel, "displayLabel"> &
      Required<Omit<EdgePreferencesStorageModel, "displayLabel">>
  >
>;

/** The default values to use when no user provided value is given. */
export const defaultVertexPreferences: Omit<
  VertexPreferences,
  "type" | "displayLabel"
> = {
  displayNameAttribute: RESERVED_ID_PROPERTY,
  longDisplayNameAttribute: RESERVED_TYPES_PROPERTY,
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
  color: "#128EE5",
  shape: "ellipse",
  backgroundOpacity: 0.4,
  borderWidth: 0,
  borderColor: "#128EE5",
  borderStyle: "solid",
};

/** The default values to use when no user provided value is given. */
export const defaultEdgePreferences: Omit<
  EdgePreferences,
  "type" | "displayLabel"
> = {
  displayNameAttribute: RESERVED_TYPES_PROPERTY,
  labelColor: "#17457b",
  labelBackgroundOpacity: 0.7,
  labelBorderColor: "#17457b",
  labelBorderStyle: "solid",
  labelBorderWidth: 0,
  lineColor: "#b3b3b3",
  lineThickness: 2,
  lineStyle: "solid",
  sourceArrowStyle: "none",
  targetArrowStyle: "triangle",
};

export type UserStyling = {
  vertices?: Array<VertexPreferencesStorageModel>;
  edges?: Array<EdgePreferencesStorageModel>;
};

/**
 * Merges this tab's changes onto the freshly-read persisted styling, keyed by
 * the per-`type` entry, so a tab editing one type never clobbers a sibling type
 * another tab persisted concurrently (issue #1820).
 *
 * The diff is computed from resulting values — `next` is this tab's styling
 * after its change, `previous` is the styling this tab last persisted (the diff
 * baseline) — never by replaying the updater, so it stays correct for
 * non-idempotent updaters.
 *
 * @param persisted The styling currently in storage (may include other tabs' writes)
 * @param previous The styling this tab last persisted; the diff baseline, which
 *   may predate several in-memory changes when rapid writes coalesce
 * @param next This tab's styling after its change
 */
export function reconcileUserStyling({
  persisted,
  previous,
  next,
}: {
  persisted: UserStyling;
  previous: UserStyling;
  next: UserStyling;
}): UserStyling {
  const vertices = mergeStylingEntriesByType(
    persisted.vertices,
    previous.vertices,
    next.vertices,
  );
  const edges = mergeStylingEntriesByType(
    persisted.edges,
    previous.edges,
    next.edges,
  );

  // Omit empty collections so the reconciled value keeps the same shape as the
  // `{}` the atom seeds with, rather than persisting explicit `undefined` keys.
  return {
    ...(vertices && { vertices }),
    ...(edges && { edges }),
  };
}

/**
 * Applies this tab's net per-`type` changes onto the persisted entries: types
 * this tab added or modified are upserted, types it removed are dropped, and
 * every other type in storage is left untouched.
 */
function mergeStylingEntriesByType<T extends { type: string }>(
  persisted: Array<T> = [],
  previous: Array<T> = [],
  next: Array<T> = [],
): Array<T> | undefined {
  const previousByType = new Map(previous.map(entry => [entry.type, entry]));
  const nextByType = new Map(next.map(entry => [entry.type, entry]));

  const merged = new Map(persisted.map(entry => [entry.type, entry]));

  // Upsert types this tab added or changed.
  for (const [type, entry] of nextByType) {
    if (!isEqual(previousByType.get(type), entry)) {
      merged.set(type, entry);
    }
  }

  // Drop types this tab removed.
  for (const type of previousByType.keys()) {
    if (!nextByType.has(type)) {
      merged.delete(type);
    }
  }

  return merged.size > 0 ? [...merged.values()] : undefined;
}

/** Vertex preferences indexed by type for O(1) lookup with default fallback. */
export const vertexPreferencesAtom = atom(get => {
  const userStyling = get(userStylingAtom);
  const lookup = new Map(
    userStyling.vertices?.map(v => [
      v.type,
      createVertexPreference(v.type, v),
    ]) ?? [],
  );
  return {
    get(type: VertexType) {
      return lookup.get(type) ?? createVertexPreference(type);
    },
  };
});

/** Edge preferences indexed by type for O(1) lookup with default fallback. */
export const edgePreferencesAtom = atom(get => {
  const userStyling = get(userStylingAtom);
  const lookup = new Map(
    userStyling.edges?.map(e => [e.type, createEdgePreference(e.type, e)]) ??
      [],
  );
  return {
    get(type: EdgeType) {
      return lookup.get(type) ?? createEdgePreference(type);
    },
  };
});

/** Combines the stored user preferences with the defined default values. */
export function createVertexPreference(
  type: VertexType,
  stored?: VertexPreferencesStorageModel,
): VertexPreferences {
  return {
    type,
    ...defaultVertexPreferences,
    ...stored,
  } as const;
}

/** Combines the stored user preferences with the defined default values. */
export function createEdgePreference(
  type: EdgeType,
  stored?: EdgePreferencesStorageModel,
) {
  return {
    type,
    ...defaultEdgePreferences,
    ...stored,
  };
}

/** Returns an array of vertex preferences based on the known vertex types in the schema. */
export function useAllVertexPreferences(): VertexPreferences[] {
  const prefs = useAtomValue(vertexPreferencesAtom);
  const { vertices: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => prefs.get(type));
}

/** Returns an array of edge preferences based on the known edge types in the schema. */
export function useAllEdgePreferences(): EdgePreferences[] {
  const prefs = useAtomValue(edgePreferencesAtom);
  const { edges: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => prefs.get(type));
}

/** Returns the user preferences for the specified vertex type. */
export function useVertexPreferences(type: VertexType): VertexPreferences {
  return useDeferredValue(useAtomValue(vertexPreferenceByTypeAtom(type)));
}

/** Returns the user preferences for the specified edge type. */
export function useEdgePreferences(type: EdgeType): EdgePreferences {
  return useDeferredValue(useAtomValue(edgePreferenceByTypeAtom(type)));
}

/**
 * Returns the user preferences for the specified vertex type.
 */
export const vertexPreferenceByTypeAtom = atomFamily((type: VertexType) =>
  atom(get => get(vertexPreferencesAtom).get(type)),
);

/**
 * Returns the user preferences for the specified edge type.
 */
export const edgePreferenceByTypeAtom = atomFamily((type: EdgeType) =>
  atom(get => get(edgePreferencesAtom).get(type)),
);

type UpdatedVertexStyle = Partial<Omit<VertexPreferences, "type">>;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: VertexType) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const vertexStyle = useVertexPreferences(type);

  const setVertexStyle = (updatedStyle: UpdatedVertexStyle) =>
    setAllStyling(prev => {
      const vertices = prev.vertices ?? [];
      const existingIndex = vertices.findIndex(v => v.type === type);

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedVertices = [...vertices];
        updatedVertices[existingIndex] = {
          ...vertices[existingIndex],
          ...updatedStyle,
        };
        return { ...prev, vertices: updatedVertices };
      } else {
        // Add new entry
        return { ...prev, vertices: [...vertices, { type, ...updatedStyle }] };
      }
    });

  const resetVertexStyle = () =>
    setAllStyling(prev => {
      return {
        ...prev,
        vertices: prev.vertices?.filter(v => v.type !== type),
      };
    });

  return {
    vertexStyle,
    setVertexStyle,
    resetVertexStyle,
  };
}

type UpdatedEdgeStyle = Omit<EdgePreferencesStorageModel, "type">;

/**
 * Provides the necessary functions for managing edge styles.
 *
 * @param type The edge type
 * @returns The edge style if it exists, an update function, and a reset function
 */
export function useEdgeStyling(type: EdgeType) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const edgeStyle = useEdgePreferences(type);

  const setEdgeStyle = (updatedStyle: UpdatedEdgeStyle) =>
    setAllStyling(prev => {
      const edges = prev.edges ?? [];
      const existingIndex = edges.findIndex(v => v.type === type);

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedEdges = [...edges];
        updatedEdges[existingIndex] = {
          ...edges[existingIndex],
          ...updatedStyle,
        };
        return { ...prev, edges: updatedEdges };
      } else {
        // Add new entry
        return { ...prev, edges: [...edges, { type, ...updatedStyle }] };
      }
    });

  const resetEdgeStyle = () =>
    setAllStyling(prev => {
      return {
        ...prev,
        edges: prev.edges?.filter(v => v.type !== type),
      };
    });

  return {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
  };
}
