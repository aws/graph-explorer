import type { OCProperties } from "../types";
import { type EntityProperties } from "@/core";

export function mapApiProperties(properties: OCProperties) {
  // openCypher maps directly to internal property value type since it is just simple JSON
  const attributes: EntityProperties = properties;
  return attributes;
}
