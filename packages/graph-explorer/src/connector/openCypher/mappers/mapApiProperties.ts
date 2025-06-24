import { EntityProperties } from "@/core";
import type { OCProperties } from "../types";

export function mapApiProperties(properties: OCProperties) {
  // openCypher maps directly to internal property value type since it is just simple JSON
  const attributes: EntityProperties = properties;
  return attributes;
}
