import { atom, selector } from "recoil";
import type { Vertex } from "../../@types/entities";
import { sanitizeText } from "../../utils";
import { activeConfigurationAtom } from "./configuration";
import isDefaultValue from "./isDefaultValue";
import { schemaAtom, SchemaInference } from "./schema";

export type Nodes = Array<Vertex>;

export const nodesAtom = atom<Nodes>({
  key: "nodes",
  default: [],
});

export const nodesSelector = selector<Nodes>({
  key: "nodes-selector",
  get: ({ get }) => {
    return get(nodesAtom);
  },
  set: ({ get, set }, newValue) => {
    if (isDefaultValue(newValue)) {
      set(nodesAtom, newValue);
      return;
    }

    set(nodesAtom, newValue);

    const activeConfig = get(activeConfigurationAtom);
    if (!activeConfig) {
      return;
    }
    const schemas = get(schemaAtom);
    const activeSchema = schemas.get(activeConfig);

    set(schemaAtom, prevSchemas => {
      const updatedSchemas = new Map(prevSchemas);

      updatedSchemas.set(activeConfig, {
        vertices: newValue.reduce((schema, node) => {
          if (!schema.find(s => s.type === node.data.__v_type)) {
            schema.push({
              type: node.data.__v_type,
              displayLabel: node.data.__v_type_display,
              attributes: Object.keys(node.data.attributes).map(attr => ({
                name: attr,
                displayLabel: sanitizeText(attr),
                hidden: false,
              })),
            });
          }

          return schema;
        }, activeSchema?.vertices as SchemaInference["vertices"]),
        edges: activeSchema?.edges || [],
        ...(activeSchema || {}),
      });

      return updatedSchemas;
    });
  },
});

export const nodesSelectedIdsAtom = atom<Set<string>>({
  key: "nodes-selected-ids",
  default: new Set(),
});

export const nodesLockedIdsAtom = atom<Set<string>>({
  key: "nodes-locked-ids",
  default: new Set(),
});

export const nodesHiddenIdsAtom = atom<Set<string>>({
  key: "nodes-hidden-ids",
  default: new Set(),
});

export const nodesOutOfFocusIdsAtom = atom<Set<string>>({
  key: "nodes-out-of-focus-ids",
  default: new Set(),
});

export const nodesFilteredIdsAtom = atom<Set<string>>({
  key: "nodes-filtered-ids",
  default: new Set(),
});

export const nodesTypesFilteredAtom = atom<Set<string>>({
  key: "nodes-types-filtered",
  default: new Set(),
});
