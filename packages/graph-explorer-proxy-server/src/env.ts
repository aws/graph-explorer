import { isIP } from "net";
import { z } from "zod";

/** Coerces a string to a boolean value in a case insensitive way. */
const BooleanStringSchema = z
  .string()
  .refine(s => s.toLowerCase() === "true" || s.toLowerCase() === "false", {
    message: 'Must be "true" or "false" (case-insensitive)',
  })
  .transform(s => s.toLowerCase() === "true");

const portMessage = "Must be a port number from 1 to 65535";

const PortSchema = z.coerce
  .number({ message: portMessage })
  .int({ message: portMessage })
  .min(1, { message: portMessage })
  .max(65535, { message: portMessage });

const EnvironmentFieldsSchema = z.object({
  HOST: z.string().default("localhost"),
  PROXY_SERVER_LISTEN_ADDRESS: z
    .string()
    .refine(value => isIP(value) !== 0, {
      message:
        "Must be an IP address such as 127.0.0.1 or ::. An empty value and a hostname are not accepted. Remove the variable to use the default.",
    })
    .default("127.0.0.1"),
  // Mirrors the startup configuration, which applies the notebook preset only
  // on an exact `true`, as the shell scripts did. Reading it any looser would
  // refuse a server that has always run with HTTPS.
  NEPTUNE_NOTEBOOK: z
    .string()
    .optional()
    .transform(value => value === "true"),
  PROXY_SERVER_HTTPS_CONNECTION: BooleanStringSchema.default(false),
  PROXY_SERVER_PORT: PortSchema.optional(),
  // Deprecated in favor of PROXY_SERVER_PORT. Their defaults depend on
  // HTTPS, so resolveServerConfig applies them, which lets it tell a set
  // value from a default one.
  PROXY_SERVER_HTTPS_PORT: z.coerce.number().optional(),
  PROXY_SERVER_HTTP_PORT: z.coerce.number().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
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
  PROXY_SERVER_ALLOWED_DB_ORIGINS: z
    .string()
    .optional()
    .transform(value => value || undefined)
    .transform(value => value?.split(",").map(v => v.trim()))
    .pipe(
      z
        .array(
          z
            .url({
              protocol: /^https?$/,
              message:
                "Must be an HTTP or HTTPS URL (e.g. https://neptune:8182)",
            })
            .refine(
              value => {
                try {
                  const pathname = new URL(value).pathname;
                  return pathname === "/" || pathname === "";
                } catch {
                  return true;
                }
              },
              {
                message:
                  "Must be an origin only (scheme://host:port), paths are not supported",
              },
            )
            .transform(value => new URL(value).origin),
        )
        .transform(origins => new Set(origins))
        .optional(),
    ),
});

/** Schema for the environment values we expect along with their defaults. */
export const EnvironmentValuesSchema = EnvironmentFieldsSchema.superRefine(
  (env, context) => {
    // The notebook preset serves over HTTP and never generates certificates,
    // so this pair can never start. Failing the parse names the real cause
    // before the server can blame the missing certificates. Refusing rather
    // than forcing HTTP off keeps an explicit TLS request from being dropped.
    if (env.NEPTUNE_NOTEBOOK && env.PROXY_SERVER_HTTPS_CONNECTION) {
      context.addIssue({
        code: "custom",
        path: ["PROXY_SERVER_HTTPS_CONNECTION"],
        message:
          "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
          "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
          "not generate TLS certificates, so this combination cannot start. " +
          "To run under the notebook preset, set PROXY_SERVER_HTTPS_CONNECTION to " +
          "false, or remove it, where it is set to true: an -e flag, .env.local, " +
          "or config.json. An -e flag overrides the other two. To run with TLS, " +
          "set NEPTUNE_NOTEBOOK to false, or remove it, where it is set to true: " +
          "an -e flag or config.json. An -e flag overrides config.json. See " +
          "https://aws.github.io/graph-explorer/references/configuration/#precedence",
      });
    }
  },
);

export type EnvironmentValues = z.infer<typeof EnvironmentValuesSchema>;

/** The text logged when the environment fails to parse. */
export function formatEnvironmentError(error: z.ZodError) {
  return `Failed to parse environment values\n${z.prettifyError(error)}`;
}
