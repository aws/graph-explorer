import type { Simplify } from "type-fest";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { useDeferredValue } from "react";

import { LABELS, RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";

import type { EdgeType, VertexType } from "../entities";

import { useActiveSchema } from "./schema";
import { userEdgeStylesAtom, userVertexStylesAtom } from "./storageAtoms";

export const SHAPE_STYLES = [
  "rectangle",
  "roundrectangle",
  "ellipse",
  "triangle",
  "pentagon",
  "hexagon",
  "heptagon",
  "octagon",
  "star",
  "barrel",
  "diamond",
  "vee",
  "rhomboid",
  "tag",
  "round-rectangle",
  "round-triangle",
  "round-diamond",
  "round-pentagon",
  "round-hexagon",
  "round-heptagon",
  "round-octagon",
  "round-tag",
  "cut-rectangle",
  "concave-hexagon",
] as const;
export type ShapeStyle = (typeof SHAPE_STYLES)[number];

export const LINE_STYLES = ["solid", "dashed", "dotted"] as const;
export type LineStyle = (typeof LINE_STYLES)[number];

export const ARROW_STYLES = [
  "triangle",
  "triangle-tee",
  "circle-triangle",
  "triangle-cross",
  "triangle-backcurve",
  "tee",
  "vee",
  "square",
  "circle",
  "diamond",
  "none",
] as const;
export type ArrowStyle = (typeof ARROW_STYLES)[number];

/**
 * The visual appearance of a vertex — the fields that make sense for both a
 * per-type style and a type-less global default. Every field is required: this
 * is the resolved baseline shape a rendered vertex always has.
 */
export type VertexVisualStyle = {
  /** Color overwrite for vertex */
  color: string;
  /** Icon overwrite for vertex */
  iconUrl: string;
  /** Icon overwrite for vertex */
  iconImageType: string;
  shape: ShapeStyle;
  backgroundOpacity: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: LineStyle;
};

/**
 * The type-specific fields of a vertex style — a display label and the
 * attributes used to derive labels. These only make sense per vertex type, so
 * they are excluded from the type-less global default.
 */
export type VertexTypeStyle = {
  /** Label overwrite for vertex */
  displayLabel?: string;
  /** Vertex attribute to be used as label */
  displayNameAttribute: string;
  /** Vertex attribute to be used as description */
  longDisplayNameAttribute: string;
};

/** The visual appearance of a label badge (shared by edge and vertex labels). */
export type LabelVisualStyle = {
  labelColor: string;
  labelBackgroundOpacity: number;
  labelBorderColor: string;
  labelBorderStyle: LineStyle;
  labelBorderWidth: number;
};

/** The visual appearance of an edge, shared by per-type styles and defaults. */
export type EdgeVisualStyle = LabelVisualStyle & {
  lineColor: string;
  lineThickness: number;
  lineStyle: LineStyle;
  sourceArrowStyle: ArrowStyle;
  targetArrowStyle: ArrowStyle;
};

/** The type-specific fields of an edge style. */
export type EdgeTypeStyle = {
  displayLabel?: string;
  displayNameAttribute: string;
};

/** The style for the specified vertex type as stored in local storage. */
export type VertexStyleStorage = Simplify<
  Partial<VertexVisualStyle & VertexTypeStyle> & { type: VertexType }
>;

/** The style for the specified edge type as stored in local storage. */
export type EdgeStyleStorage = Simplify<
  Partial<EdgeVisualStyle & EdgeTypeStyle> & { type: EdgeType }
>;

/** The resolved style for the specified vertex type as an immutable object. */
export type VertexStyle = Simplify<
  Readonly<VertexVisualStyle & VertexTypeStyle & { type: VertexType }>
>;

/** The resolved style for the specified edge type as an immutable object. */
export type EdgeStyle = Simplify<
  Readonly<EdgeVisualStyle & EdgeTypeStyle & { type: EdgeType }>
>;

/** The default values to use when no user provided value is given. */
export const appDefaultVertexStyle = {
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
} as const satisfies Omit<VertexStyle, "type">;

/**
 * The default appearance of a node's label badge. Nodes have no per-type label
 * styling (see {@link VertexVisualStyle}), so this is the single source for how
 * a node label looks. Values mirror the node label config in
 * `components/Graph/styles/defaultNodeStyle.ts` (`text.background` →
 * `labelColor`, `text.opacity` → `labelBackgroundOpacity`) — keep in sync if
 * that canvas style changes.
 */
export const appDefaultNodeLabelStyle = {
  labelColor: "#1d2531",
  labelBackgroundOpacity: 0.7,
  labelBorderColor: "#1d2531",
  labelBorderStyle: "solid",
  labelBorderWidth: 0,
} as const satisfies LabelVisualStyle;

/** The default values to use when no user provided value is given. */
export const appDefaultEdgeStyle = {
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
} as const satisfies Omit<EdgeStyle, "type">;

/**
 * @deprecated Legacy IndexedDB shape stored under the `"user-styling"` key.
 * Superseded by `userVertexStylesAtom` and `userEdgeStylesAtom`. Only referenced by
 * the startup migration in `migrateUserStyling.ts`. Do not use this type in
 * new code.
 */
export type LegacyUserStylingStorage = {
  vertices?: Array<VertexStyleStorage>;
  edges?: Array<EdgeStyleStorage>;
};

/**
 * The single place vertex/edge appearance is assembled: a type's stored user
 * style overrides the app defaults per field, falling back to the defaults for
 * anything unset. User styles come from the style dialogs and from loading a
 * file (`core/styling`); the `icon`↔`iconUrl` rename happens at the file-format
 * seam in that parser, not here.
 */

/** Vertex styles indexed by type for O(1) lookup, resolved against defaults. */
export const vertexStyleAtom = atom(get => {
  const userStyles = get(userVertexStylesAtom);
  return {
    get(type: VertexType) {
      return resolveVertexStyle(type, userStyles.get(type));
    },
    /**
     * The resolved style for a vertex carrying one or more types — see
     * {@link resolveVertexStyleForTypes}. Use this (not repeated `get` calls)
     * whenever the caller has an actual vertex instance rather than a single
     * schema type, so styling reflects every type the vertex has.
     */
    getForTypes(types: readonly VertexType[]) {
      return resolveVertexStyleForTypes(types, userStyles);
    },
  };
});

/** Edge styles indexed by type for O(1) lookup, resolved against defaults. */
export const edgeStyleAtom = atom(get => {
  const userStyles = get(userEdgeStylesAtom);
  return {
    get(type: EdgeType) {
      return resolveEdgeStyle(type, userStyles.get(type));
    },
  };
});

/** The user's vertex style overlaid on the app defaults. */
export function resolveVertexStyle(
  type: VertexType,
  user?: VertexStyleStorage,
): VertexStyle {
  return {
    type,
    ...appDefaultVertexStyle,
    ...user,
  } as const;
}

/**
 * A stable, order-independent identity for a vertex's full set of types —
 * every distinct combination of types gets one key, and the same set of
 * types (in any order) always produces the same key. Reuses the
 * {@link VertexType} brand since it is consumed exactly like one: as an
 * opaque Cytoscape selector value and style-lookup key (see
 * `useGraphStyles.ts` and {@link resolveVertexStyleForTypes}). It is never a
 * real schema type and must not be shown to the user or looked up against
 * schema/connection data — {@link DisplayVertex.displayTypes} is the
 * user-facing type label.
 */
function sortedUniqueTypes(types: readonly VertexType[]): VertexType[] {
  return [...new Set(types)].sort();
}

export function vertexTypeSetKey(types: readonly VertexType[]): VertexType {
  return sortedUniqueTypes(types).join(" ") as VertexType;
}

/**
 * Merges the stored user style for every one of a vertex's types into one set
 * of fields, so a vertex with multiple `rdf:type` values (common once RDFS/OWL
 * inference is in play — every superclass ends up asserted as a peer
 * `rdf:type`) picks up styling from all of them rather than an arbitrary one.
 * A field left unset by one type falls through to another type that does set
 * it — e.g. a `borderColor` styled once on a shared ancestor class applies to
 * every subtype automatically, without repeating it on each one.
 *
 * Conflicts — two of the vertex's types both set the same field — are
 * resolved by folding the types in ascending lexicographic order, so the
 * lexicographically-last type's value wins. This is a **stable, reproducible
 * tiebreak, not a specificity judgement**: nothing in the app tracks
 * `rdfs:subClassOf` (or any other) class hierarchy today — schema sync only
 * samples instance data (types + attribute names) for every connector, so
 * there is no signal available to determine which of a resource's asserted
 * types is actually "more specific" than another. Sorting at least makes the
 * outcome a deterministic property of the type names themselves instead of an
 * accident of SPARQL query result order, which is what motivated this fix
 * (see the linked issue). A hierarchy-aware tiebreak would be a natural
 * follow-up once class-hierarchy data is tracked anywhere in the app.
 */
export function mergeVertexStyleFields(
  types: readonly VertexType[],
  userStyles: ReadonlyMap<VertexType, VertexStyleStorage>,
): Omit<VertexStyleStorage, "type"> {
  let merged: Omit<VertexStyleStorage, "type"> = {};
  for (const type of sortedUniqueTypes(types)) {
    const style = userStyles.get(type);
    if (!style) {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the per-type `type` field, only the fields matter
    const { type: _type, ...fields } = style;
    merged = { ...merged, ...fields };
  }
  return merged;
}

/**
 * The resolved style for a vertex carrying one or more types — see
 * {@link mergeVertexStyleFields} for how conflicts across types are resolved.
 * `type` on the result is {@link vertexTypeSetKey}'s composite key, not a
 * single real type, since the resolved style may draw fields from more than
 * one type.
 */
export function resolveVertexStyleForTypes(
  types: readonly VertexType[],
  userStyles: ReadonlyMap<VertexType, VertexStyleStorage>,
): VertexStyle {
  const merged = mergeVertexStyleFields(types, userStyles);
  return {
    type: vertexTypeSetKey(types),
    ...appDefaultVertexStyle,
    ...merged,
  } as const;
}

/** The user's edge style overlaid on the app defaults. */
export function resolveEdgeStyle(
  type: EdgeType,
  user?: EdgeStyleStorage,
): EdgeStyle {
  return {
    type,
    ...appDefaultEdgeStyle,
    ...user,
  } as const;
}

/** Returns an array of vertex styles based on the known vertex types in the schema.
 * Always includes an entry for `LABELS.MISSING_TYPE` so that blank nodes (which are
 * assigned that synthetic type at runtime) receive icon styling on the canvas.
 */
export function useAllVertexStyles(): VertexStyle[] {
  const styles = useAtomValue(vertexStyleAtom);
  const { vertices: allSchemas } = useActiveSchema();
  const schemaStyles = allSchemas.map(({ type }) => styles.get(type));

  const missingType = LABELS.MISSING_TYPE as VertexType;
  const alreadyIncluded = schemaStyles.some(s => s.type === missingType);
  if (alreadyIncluded) {
    return schemaStyles;
  }
  return [...schemaStyles, styles.get(missingType)];
}

/** Returns an array of edge styles based on the known edge types in the schema. */
export function useAllEdgeStyles(): EdgeStyle[] {
  const styles = useAtomValue(edgeStyleAtom);
  const { edges: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => styles.get(type));
}

/** Returns the resolved style for the specified vertex type. */
export function useVertexStyle(type: VertexType): VertexStyle {
  return useDeferredValue(useAtomValue(vertexStyleByTypeAtom(type)));
}

/**
 * Returns the resolved style for a vertex instance, merged across every type
 * it has — see {@link resolveVertexStyleForTypes}. Use this instead of
 * {@link useVertexStyle} whenever `types` is an actual vertex's asserted
 * types rather than a single schema type being styled/edited on its own
 * (e.g. the Schema view's Styles panel, or a legend listing every known
 * type — those still want {@link useVertexStyle} for one type at a time).
 */
export function useVertexStyleForTypes(
  types: readonly VertexType[],
): VertexStyle {
  return useDeferredValue(
    useAtomValue(vertexStyleByTypesAtom(vertexTypeSetKey(types))),
  );
}

/** Returns the resolved style for the specified edge type. */
export function useEdgeStyle(type: EdgeType): EdgeStyle {
  return useDeferredValue(useAtomValue(edgeStyleByTypeAtom(type)));
}

/**
 * Returns the resolved style for the specified vertex type.
 */
export const vertexStyleByTypeAtom = atomFamily((type: VertexType) =>
  atom(get => get(vertexStyleAtom).get(type)),
);

/**
 * Returns the resolved style for a vertex's full set of types, keyed by
 * {@link vertexTypeSetKey} — atomFamily needs a primitive key, and the key
 * already carries the sorted, deduplicated type list, so it is split back
 * into types rather than threading the original array through separately.
 */
export const vertexStyleByTypesAtom = atomFamily((typesKey: VertexType) =>
  atom(get =>
    get(vertexStyleAtom).getForTypes(
      typesKey === "" ? [] : (typesKey.split(" ") as VertexType[]),
    ),
  ),
);

/**
 * Returns the resolved style for the specified edge type.
 */
export const edgeStyleByTypeAtom = atomFamily((type: EdgeType) =>
  atom(get => get(edgeStyleAtom).get(type)),
);

type UpdatedVertexStyle = Partial<Omit<VertexStyle, "type">>;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: VertexType) {
  const setVertexStyles = useSetAtom(userVertexStylesAtom);
  const vertexStyle = useVertexStyle(type);

  const setVertexStyle = (updatedStyle: UpdatedVertexStyle) =>
    setVertexStyles(prev =>
      new Map(prev).set(type, { ...prev.get(type), ...updatedStyle, type }),
    );

  const resetVertexStyle = () =>
    setVertexStyles(prev => {
      const next = new Map(prev);
      next.delete(type);
      return next;
    });

  return {
    vertexStyle,
    setVertexStyle,
    resetVertexStyle,
  };
}

type UpdatedEdgeStyle = Partial<Omit<EdgeStyle, "type">>;

/**
 * Provides the necessary functions for managing edge styles.
 *
 * @param type The edge type
 * @returns The edge style if it exists, an update function, and a reset function
 */
export function useEdgeStyling(type: EdgeType) {
  const setEdgeStyles = useSetAtom(userEdgeStylesAtom);
  const edgeStyle = useEdgeStyle(type);

  const setEdgeStyle = (updatedStyle: UpdatedEdgeStyle) =>
    setEdgeStyles(prev =>
      new Map(prev).set(type, { ...prev.get(type), ...updatedStyle, type }),
    );

  const resetEdgeStyle = () =>
    setEdgeStyles(prev => {
      const next = new Map(prev);
      next.delete(type);
      return next;
    });

  return {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
  };
}
