import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

import { clientRoot } from "./paths.js";

/** Coerces a string to a boolean value in a case insensitive way. */
export const BooleanStringSchema = z
  .string()
  .refine(s => s.toLowerCase() === "true" || s.toLowerCase() === "false")
  .transform(s => s.toLowerCase() === "true");

// Define a required schema for the values we expect along with their defaults
const EnvironmentValuesSchema = z.object({
  HOST: z.string().default("localhost"),
  PROXY_SERVER_HTTPS_CONNECTION: BooleanStringSchema.default(false),
  PROXY_SERVER_HTTPS_PORT: z.coerce.number().default(443),
  PROXY_SERVER_HTTP_PORT: z.coerce.number().default(80),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("debug"),
  LOG_STYLE: z.enum(["cloudwatch", "default"]).default("default"),
  CONFIGURATION_FOLDER_PATH: z.coerce.string().default(clientRoot),
});

const defaultConnectionFolderPath = process.env.CONFIGURATION_FOLDER_PATH
  ? process.env.CONFIGURATION_FOLDER_PATH
  : clientRoot;

// Load environment variables from .env file.
dotenv.config({
  path: [
    path.join(clientRoot, ".env.local"),
    path.join(clientRoot, ".env"),
    path.join(defaultConnectionFolderPath, ".env"),
  ],
});

// Parse the environment values from the process
const parsedEnvironmentValues = EnvironmentValuesSchema.safeParse(process.env);

if (!parsedEnvironmentValues.success) {
  console.error("Failed to parse environment values");
  const flattenedErrors = parsedEnvironmentValues.error.flatten();
  console.error(flattenedErrors.fieldErrors);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("Parsed environment values:", parsedEnvironmentValues.data);

// Adds all environment values to local object
export const env = {
  ...parsedEnvironmentValues.data,
};
