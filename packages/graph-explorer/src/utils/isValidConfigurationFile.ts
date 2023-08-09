import {
  AttributeConfig,
  ConfigurationContextProps,
  EdgeTypeConfig,
  VertexTypeConfig,
} from "../core";

const isValidHttpUrl = (str: string) => {
  let url;
  try {
    url = new URL(str);
  } catch {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

const isValidAttributeConfig = (attr: any): attr is AttributeConfig => {
  if (!attr.name) {
    return false;
  }

  return true;
};

const isValidEdgeConfig = (edge: any): edge is EdgeTypeConfig => {
  if (!edge.type) {
    return false;
  }

  return true;
};

const isValidVertexConfig = (vertex: any): vertex is VertexTypeConfig => {
  if (!vertex.type) {
    return false;
  }

  for (const attr of vertex.attributes) {
    if (!isValidAttributeConfig(attr)) {
      return false;
    }
  }

  return true;
};

const isValidConfigurationFile = (
  data: any
): data is Pick<
  ConfigurationContextProps,
  "id" | "displayLabel" | "connection" | "schema"
> => {
  if (!data.id || !data.connection || !data.schema) {
    return false;
  }

  if (
    !data.connection.url ||
    !data.connection.queryEngine ||
    !isValidHttpUrl(data.connection.url) ||
    !["gremlin", "sparql", "openCypher"].includes(data.connection.queryEngine)
  ) {
    return false;
  }

  for (const e of data.schema.edges) {
    if (!isValidEdgeConfig(e)) {
      return false;
    }
  }

  for (const v of data.schema.vertices) {
    if (!isValidVertexConfig(v)) {
      return false;
    }
  }

  return true;
};

export default isValidConfigurationFile;
