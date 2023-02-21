import { atom, selector } from "recoil";
import type { Edge } from "../../@types/entities";
import { sanitizeText } from "../../utils";
import { activeConfigurationAtom } from "./configuration";
import isDefaultValue from "./isDefaultValue";
import { schemaAtom, SchemaInference } from "./schema";

export type Edges = Array<Edge>;

export const edgesAtom = atom<Edges>({
  key: "edges",
  default: [],
});

export const edgesSelector = selector<Edges>({
  key: "edges-selector",
  get: ({ get }) => {
    return get(edgesAtom);
  },
  set: ({ get, set }, newValue) => {
    if (isDefaultValue(newValue)) {
      set(edgesAtom, newValue);
      return;
    }

    set(edgesAtom, newValue);

    const cleanFn = (curr: Set<string>) => {
      const existingEdgesIds = new Set<string>();
      curr.forEach(eId => {
        const exist = newValue.find(n => n.data.id === eId);
        if (exist) {
          existingEdgesIds.add(eId);
        }
      });
      return existingEdgesIds;
    };
    // Clean all dependent states
    get(edgesSelectedIdsAtom).size > 0 && set(edgesSelectedIdsAtom, cleanFn);
    get(edgesHiddenIdsAtom).size > 0 && set(edgesHiddenIdsAtom, cleanFn);
    get(edgesOutOfFocusIdsAtom).size > 0 &&
      set(edgesOutOfFocusIdsAtom, cleanFn);
    get(edgesFilteredIdsAtom).size > 0 && set(edgesFilteredIdsAtom, cleanFn);

    const activeConfig = get(activeConfigurationAtom);
    if (!activeConfig) {
      return;
    }
    const schemas = get(schemaAtom);
    const activeSchema = schemas.get(activeConfig);

    set(schemaAtom, prevSchemas => {
      const updatedSchemas = new Map(prevSchemas);

      updatedSchemas.set(activeConfig, {
        edges: newValue.reduce((schema, edge) => {
          if (!schema.find(s => s.type === edge.data.type)) {
            schema.push({
              type: edge.data.type,
              displayLabel: "",
              attributes: Object.keys(edge.data.attributes).map(attr => ({
                name: attr,
                displayLabel: sanitizeText(attr),
                hidden: false,
              })),
            });
          }

          return schema;
        }, activeSchema?.edges as SchemaInference["edges"]),
        vertices: activeSchema?.vertices || [],
        ...(activeSchema || {}),
      });

      return updatedSchemas;
    });
  },
});

export const edgesSelectedIdsAtom = atom<Set<string>>({
  key: "edges-selected-ids",
  default: new Set(),
});

export const edgesHiddenIdsAtom = atom<Set<string>>({
  key: "edges-hidden-ids",
  default: new Set(),
});

export const edgesOutOfFocusIdsAtom = atom<Set<string>>({
  key: "edges-out-of-focus-ids",
  default: new Set(),
});

export const edgesFilteredIdsAtom = atom<Set<string>>({
  key: "edges-filtered-ids",
  default: new Set(),
});

export const edgesTypesFilteredAtom = atom<Set<string>>({
  key: "edges-types-filtered",
  default: new Set(),
});
