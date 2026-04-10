import { z } from "zod";

/** Coerces a string to a boolean value in a case insensitive way. */
const BooleanStringSchema = z
  .string()
  .refine(s => s.toLowerCase() === "true" || s.toLowerCase() === "false")
  .transform(s => s.toLowerCase() === "true");

/** Schema for the environment values we expect along with their defaults. */
export const EnvironmentValuesSchema = z.object({
  HOST: z.string().default("localhost"),
  PROXY_SERVER_HTTPS_CONNECTION: BooleanStringSchema.default(false),
  PROXY_SERVER_HTTPS_PORT: z.coerce.number().default(443),
  PROXY_SERVER_HTTP_PORT: z.coerce.number().default(80),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("debug"),
  LOG_STYLE: z.enum(["cloudwatch", "default"]).default("default"),
  PROXY_SERVER_CORS_ORIGIN: z
    .string()
    .optional()
    .transform(value => value || undefined)
    .transform(value => value?.split(",").map(v => v.trim()))
    .pipe(
      z
        .array(
          z
            .httpUrl({
              message:
                "Must be an HTTP or HTTPS URL (e.g. https://example.com)",
            })
            .transform(value => new URL(value).origin),
        )
        .optional(),
    ),
});

export type EnvironmentValues = z.infer<typeof EnvironmentValuesSchema>;

/** Parses and validates environment values, exiting the process on failure. */
export function parseEnvironmentValues(
  env: Record<string, string | undefined>,
): EnvironmentValues {
  const result = EnvironmentValuesSchema.safeParse(env);
  if (result.success) {
    return result.data;
  }
  console.error("Failed to parse environment values");
  console.error(z.prettifyError(result.error));
  return process.exit(1);
}
