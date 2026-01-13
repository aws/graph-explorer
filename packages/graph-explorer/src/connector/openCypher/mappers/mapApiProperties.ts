import z from "zod";

import type { EntityProperties } from "@/core";

import type { OCProperties } from "../types";

export function mapApiProperties(properties: OCProperties) {
  const mappedProperties: EntityProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    // Parse date values
    if (typeof value === "string" && isDateString(value)) {
      mappedProperties[key] = new Date(value);
    } else {
      mappedProperties[key] = value;
    }
  }

  return mappedProperties;
}

const isDateString = (value: string): boolean => {
  return z.string().datetime().safeParse(value).success;
};
