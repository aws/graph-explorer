import { atom, selector } from "recoil";
import type { Vertex } from "../../@types/entities";
import { sanitizeText } from "../../utils";
import isDefaultValue from "./isDefaultValue";
import { schemaAtom } from "./schema";
import { activeConfigurationAtom } from "./configuration";

export const nodesAtom = atom<Array<Vertex>>({
  key: "nodes",
  default: [],
});

export const nodesSelector = selector<Array<Vertex>>({
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
    const cleanFn = (curr: Set<string>) => {
      const existingNodesIds = new Set<string>();
      curr.forEach(nId => {
        const exist = newValue.find(n => n.data.id === nId);
        if (exist) {
          existingNodesIds.add(nId);
        }
      });
      return existingNodesIds;
    };
    // Clean all dependent states
    get(nodesSelectedIdsAtom).size > 0 && set(nodesSelectedIdsAtom, cleanFn);
    get(nodesHiddenIdsAtom).size > 0 && set(nodesHiddenIdsAtom, cleanFn);
    get(nodesOutOfFocusIdsAtom).size > 0 &&
      set(nodesOutOfFocusIdsAtom, cleanFn);
    get(nodesFilteredIdsAtom).size > 0 && set(nodesFilteredIdsAtom, cleanFn);

    const activeConfig = get(activeConfigurationAtom);
    const schemas = get(schemaAtom);
    const activeSchema = activeConfig && schemas.get(activeConfig);
    if (!activeSchema) {
      return;
    }

    set(schemaAtom, prevSchemas => {
      const updatedSchemas = new Map(prevSchemas);

      const updatedNodes = newValue.reduce((schema, node) => {
        // Find the node type definition in the schema
        const schemaNode = schema.find(s => s.type === node.data.type);

        // Add node to schema if it is missing
        if (!schemaNode) {
          schema.push({
            type: node.data.type,
            displayLabel: "",
            attributes: Object.keys(node.data.attributes).map(attr => ({
              name: attr,
              displayLabel: sanitizeText(attr),
              hidden: false,
            })),
          });

          // Since the node type is new we can go ahead and return
          return schema;
        }

        // Ensure the node attributes are updated in the schema
        const schemaAttributes = schemaNode.attributes.map(a => a.name);
        const missingAttributeNames = Object.keys(node.data.attributes).filter(
          name => !schemaAttributes.includes(name)
        );

        for (const attributeName of missingAttributeNames) {
          schemaNode.attributes.push({
            name: attributeName,
            displayLabel: sanitizeText(attributeName),
            hidden: false,
          });
        }

        return schema;
      }, activeSchema.vertices);

      updatedSchemas.set(activeConfig, {
        ...activeSchema,
        vertices: updatedNodes,
      });

      return updatedSchemas;
    });
  },
});

export const nodesSelectedIdsAtom = atom<Set<string>>({
  key: "nodes-selected-ids",
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
