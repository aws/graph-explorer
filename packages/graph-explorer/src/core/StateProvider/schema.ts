import type {
  AttributeConfig,
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "@/core/ConfigurationProvider";
import { atomWithLocalForageAsync } from "./localForageEffect";
import { activeConfigurationAtom } from "./configuration";
import type { Edge, Entities, EntityProperties, Vertex } from "@/core";
import { logger } from "@/utils";
import generatePrefixes from "@/utils/generatePrefixes";
import { startTransition, useCallback } from "react";
import { atom } from "jotai";
import { RESET, useAtomCallback } from "jotai/utils";
import type { SetStateActionWithReset } from "@/utils/jotai";
import { createTypedValue, type ScalarValue } from "@/connector/entities";

export type SchemaInference = {
  vertices: VertexTypeConfig[];
  edges: EdgeTypeConfig[];
  prefixes?: Array<PrefixTypeConfig>;
  lastUpdate?: Date;
  triedToSync?: boolean;
  lastSyncFail?: boolean;
  totalVertices?: number;
  totalEdges?: number;
};

export const [schemaAtom, schemaAsyncAtom] = atomWithLocalForageAsync(
  new Map<string, SchemaInference>(),
  "schema"
);

export const activeSchemaSelector = atom(
  get => {
    const schemaMap = get(schemaAtom);
    const id = get(activeConfigurationAtom);
    const activeSchema = id ? schemaMap.get(id) : null;
    return activeSchema;
  },
  async (
    get,
    set,
    update: SetStateActionWithReset<SchemaInference | undefined>
  ) => {
    const schemaId = get(activeConfigurationAtom);
    if (!schemaId) {
      return;
    }
    await set(schemaAtom, async prevSchemaMap => {
      const updatedSchemaMap = new Map(await prevSchemaMap);
      const prev = updatedSchemaMap.get(schemaId);
      const newValue = typeof update === "function" ? update(prev) : update;

      // Handle reset value or undefined
      if (newValue === RESET || !newValue) {
        updatedSchemaMap.delete(schemaId);
        return updatedSchemaMap;
      }

      // Update the map
      updatedSchemaMap.set(schemaId, newValue);

      return updatedSchemaMap;
    });
  }
);

/** Updates the schema based on the given nodes and edges. */
export function updateSchemaFromEntities(
  entities: Partial<Entities>,
  schema: SchemaInference
) {
  const vertices = entities.vertices ?? [];
  const edges = entities.edges ?? [];

  const newVertexConfigs = vertices.flatMap(mapVertexToTypeConfigs);
  const newEdgeConfigs = edges.map(mapEdgeToTypeConfig);

  let newSchema = {
    ...schema,
    vertices: merge(schema.vertices, newVertexConfigs),
    edges: merge(schema.edges, newEdgeConfigs),
  } satisfies SchemaInference;

  // Update the generated prefixes in the schema
  newSchema = updateSchemaPrefixes(newSchema);

  logger.debug("Updated schema:", newSchema);
  return newSchema;
}

/** Merges new node or edge configs in to a set of existing node or edge configs. */
function merge<T extends VertexTypeConfig | EdgeTypeConfig>(
  existing: T[],
  newConfigs: T[]
): T[] {
  const configMap = new Map(existing.map(vt => [vt.type, vt]));

  for (const newConfig of newConfigs) {
    const existingConfig = configMap.get(newConfig.type);
    if (!existingConfig) {
      configMap.set(newConfig.type, newConfig);
    } else {
      const mergedAttributes = mergeAttributes(
        existingConfig.attributes,
        newConfig.attributes
      );
      configMap.set(newConfig.type, {
        ...existingConfig,
        attributes: mergedAttributes,
      });
    }
  }

  return Array.from(configMap.values());
}

export function mergeAttributes(
  existing: AttributeConfig[],
  newAttributes: AttributeConfig[]
): AttributeConfig[] {
  const attrMap = new Map(existing.map(attr => [attr.name, attr]));

  for (const newAttr of newAttributes) {
    const existingAttr = attrMap.get(newAttr.name);
    if (!existingAttr) {
      attrMap.set(newAttr.name, newAttr);
    } else {
      attrMap.set(newAttr.name, {
        ...existingAttr,
        ...newAttr,
      });
    }
  }

  return Array.from(attrMap.values());
}

export function mapVertexToTypeConfigs(vertex: Vertex): VertexTypeConfig[] {
  return vertex.types.map(type => ({
    type,
    attributes: Object.entries(vertex.attributes).map(([name, value]) => ({
      name,
      dataType: detectDataType(value),
    })),
  }));
}

export function mapEdgeToTypeConfig(edge: Edge): EdgeTypeConfig {
  return {
    type: edge.type,
    attributes: Object.entries(edge.attributes).map(([name, value]) => ({
      name,
      dataType: detectDataType(value),
    })),
  };
}

function detectDataType(value: ScalarValue) {
  const typedValue = createTypedValue(value);
  switch (typedValue.type) {
    case "string":
      return "String";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
    case "date":
      return "Date";
    case "null":
      return undefined;
  }
}

/** Generate RDF prefixes for all the resource URIs in the schema. */
export function updateSchemaPrefixes(schema: SchemaInference): SchemaInference {
  const existingPrefixes = schema.prefixes ?? [];

  // Get all the resource URIs from the vertex and edge type configs
  const resourceUris = getResourceUris(schema);

  if (resourceUris.size === 0) {
    return schema;
  }

  const genPrefixes = generatePrefixes(resourceUris, existingPrefixes);
  if (!genPrefixes?.length) {
    return schema;
  }

  logger.debug("Updating schema with prefixes:", genPrefixes);

  return {
    ...schema,
    prefixes: genPrefixes,
  };
}

/** A performant way to construct the set of resource URIs from the schema. */
function getResourceUris(schema: SchemaInference) {
  const result = new Set<string>();

  schema.vertices.forEach(v => {
    result.add(v.type);
    v.attributes.forEach(attr => {
      result.add(attr.name);
    });
  });
  schema.edges.forEach(e => {
    result.add(e.type);
  });

  return result;
}

/** Updates the schema with any new vertex or edge types, any new attributes, and updates the generated prefixes for sparql connections. */
export function useUpdateSchemaFromEntities() {
  return useAtomCallback(
    useCallback((get, set, entities: Partial<Entities>) => {
      const vertices = entities.vertices ?? [];
      const edges = entities.edges ?? [];
      const activeSchema = get(activeSchemaSelector);
      if (vertices.length === 0 && edges.length === 0) {
        return;
      }
      if (!activeSchema) {
        return;
      }
      if (!shouldUpdateSchemaFromEntities(entities, activeSchema)) {
        logger.debug("Schema is already up to date with the given entities");
        return;
      }
      startTransition(() => {
        logger.debug("Updating schema from entities");
        set(activeSchemaSelector, prev => {
          if (!prev) {
            return prev;
          }
          return updateSchemaFromEntities(entities, prev);
        });
      });
    }, [])
  );
}

export type UpdateSchemaHandler = ReturnType<
  typeof useUpdateSchemaFromEntities
>;

/** Attempts to efficiently detect if the schema should be updated. */
export function shouldUpdateSchemaFromEntities(
  entities: Partial<Entities>,
  schema: SchemaInference
) {
  const vertices = entities.vertices ?? [];
  const edges = entities.edges ?? [];
  if (vertices.length > 0) {
    // Check if the vertex types and attributes are the same
    const fromEntities = getUniqueTypesAndAttributes(vertices);
    const fromSchema = getUniqueTypesAndAttributes(schema.vertices);

    if (!fromSchema.isSupersetOf(fromEntities)) {
      logger.debug(
        "Found new vertex types or attributes:",
        fromEntities.difference(fromSchema)
      );
      return true;
    }
  }

  if (edges.length > 0) {
    // Check if the edge types and attributes are the same
    const fromEntities = getUniqueTypesAndAttributes(edges);
    const fromSchema = getUniqueTypesAndAttributes(schema.edges);

    if (!fromSchema.isSupersetOf(fromEntities)) {
      logger.debug(
        "Found new edge types or attributes:",
        fromEntities.difference(fromSchema)
      );
      return true;
    }
  }

  return false;
}

/**
 * Creates a set of unique types and attribute names as a set of strings in order to be used for comparisons.
 *
 * The entries in the set will be in the format of `vertexType.attributeName` or `edgeType.attributeName`.
 */
function getUniqueTypesAndAttributes(
  entities: (Vertex | Edge | VertexTypeConfig | EdgeTypeConfig)[]
) {
  return new Set(
    entities.flatMap(e => {
      return [
        e.type,
        ...getAttributeNames(e.attributes).map(a => `${e.type}.${a}`),
      ];
    })
  );
}

function getAttributeNames(attributes: EntityProperties | AttributeConfig[]) {
  return Array.isArray(attributes)
    ? attributes.map(a => a.name)
    : Object.keys(attributes);
}
