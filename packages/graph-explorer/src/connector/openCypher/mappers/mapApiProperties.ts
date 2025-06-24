import { EntityProperties } from "@/core";
import type { OCProperties } from "../types";

export function mapApiProperties(properties: OCProperties) {
  const attributes: EntityProperties = {};

  // Map to expected types
  for (const [key, value] of Object.entries(properties)) {
    attributes[key] = value;
  }
  return attributes;
}
