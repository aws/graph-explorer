import {
  type ConnectionConfig,
  type NeptuneServiceType,
  neptuneServiceTypeOptions,
  queryEngineOptions,
} from "@shared/types";
import { z } from "zod";

import { DEFAULT_SERVICE_TYPE } from "@/utils";

import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import { ConnectionLinkError } from "./connectionLinkError";

/**
 * Every message is phrased to follow the parameter's own name, so a failure
 * reads back to the user as the requirement it broke: "graphDbUrl must be a
 * valid http or https URL".
 */
const UrlConnectionParamsSchema = z.object({
  // Only http(s) endpoints are meaningful, and constraining the scheme keeps a
  // crafted link from seeding the form with something like `javascript:`.
  //
  // Credentials in the URL are refused by `fetch` itself (the Request
  // constructor throws on them), so a link carrying them could only build a
  // connection that fails every query, after persisting the password to
  // IndexedDB and into any exported connection file. Graph Explorer
  // authenticates with IAM, never userinfo.
  graphDbUrl: z
    .url({
      protocol: /^https?$/,
      error: "must be a valid http or https URL",
    })
    .refine(value => !hasCredentials(value), {
      error: "cannot include a username or password",
    }),
  // Absent values take a default, but an explicit value we do not support is a
  // rejection rather than a coercion: silently answering `queryEngine=sql` with
  // Gremlin would build a connection that queries the database in a language the
  // caller never asked for.
  queryEngine: z
    .enum(queryEngineOptions, { error: mustBeOneOf(queryEngineOptions) })
    .default("gremlin"),
  awsRegion: z.string().default(""),
  serviceType: z
    .enum(neptuneServiceTypeOptions, {
      error: mustBeOneOf(neptuneServiceTypeOptions),
    })
    .optional(),
  // An explicit `?name=` is the same as omitting it: `URLSearchParams.get`
  // returns "" rather than null, which would otherwise survive as an empty
  // display label instead of falling back to the hostname.
  name: z
    .string()
    .optional()
    .transform(name => name || undefined),
});

function mustBeOneOf(options: readonly string[]): string {
  return `must be one of ${options.map(option => `"${option}"`).join(", ")}`;
}

export type UrlConnectionParams = z.infer<typeof UrlConnectionParamsSchema> & {
  name: string;
};

/**
 * Whether a URL carries userinfo. Zod runs every check on a field even after an
 * earlier one failed, so this also sees values that are not URLs at all; those
 * are reported by the `url()` check and carry no credentials to find here.
 */
function hasCredentials(graphDbUrl: string): boolean {
  const parsed = safeParseUrl(graphDbUrl);
  return Boolean(parsed?.username || parsed?.password);
}

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * What a route's search string carries. `absent` and `invalid` are deliberately
 * distinct: a link whose `graphDbUrl` failed validation is a broken link worth
 * telling the user about, while no `graphDbUrl` at all means the user simply is
 * not following a connection link.
 */
export type ConnectionLink =
  | { kind: "absent" }
  | { kind: "invalid"; error: ConnectionLinkError }
  | { kind: "valid"; params: UrlConnectionParams };

/** Reads URL search params as a connection link. */
export function readConnectionLink(search: string): ConnectionLink {
  const params = new URLSearchParams(search);
  const graphDbUrl = params.get("graphDbUrl");
  if (!graphDbUrl) {
    return { kind: "absent" };
  }

  const parsed = UrlConnectionParamsSchema.safeParse({
    graphDbUrl,
    queryEngine: params.get("queryEngine") ?? undefined,
    awsRegion: params.get("awsRegion") ?? undefined,
    serviceType: params.get("serviceType") ?? undefined,
    name: params.get("name") ?? undefined,
  });

  if (!parsed.success) {
    return {
      kind: "invalid",
      error: new ConnectionLinkError(
        parsed.error.issues.map(issue => ({
          param: issue.path.join("."),
          requirement: issue.message,
        })),
      ),
    };
  }

  return {
    kind: "valid",
    params: {
      ...parsed.data,
      name: parsed.data.name ?? deriveNameFromUrl(graphDbUrl),
    },
  };
}

/**
 * Derives a connection name from a database URL by taking the full hostname
 * (without scheme or port), which the user can recognize at a glance. The URL
 * is already validated as http(s) by the time this runs, so `new URL` is safe.
 *
 * Derived at parse time rather than only when creating, so a nameless link keeps
 * identifying the connection it created even after the user adds a second
 * connection to the same endpoint under a name of their own: the link's derived
 * name still matches the connection that same derivation named.
 */
function deriveNameFromUrl(graphDbUrl: string): string {
  const { hostname } = new URL(graphDbUrl);
  return hostname || graphDbUrl;
}

/**
 * The auth posture a connection link or existing connection carries. This is
 * part of a connection's identity for matching: a link requesting IAM in a
 * given region/service type is a *different* connection from a plaintext one to
 * the same endpoint, so it must not silently reuse it. When IAM is off, region
 * and service type are not meaningful and are normalized away.
 */
type AuthPosture = {
  awsAuthEnabled: boolean;
  awsRegion: string;
  serviceType: NeptuneServiceType | undefined;
};

/** The auth posture a connection link's params resolve to. */
function authPostureFromParams(params: UrlConnectionParams): AuthPosture {
  const awsAuthEnabled = Boolean(params.awsRegion);
  return {
    awsAuthEnabled,
    awsRegion: awsAuthEnabled ? params.awsRegion : "",
    serviceType: awsAuthEnabled
      ? (params.serviceType ?? DEFAULT_SERVICE_TYPE)
      : undefined,
  };
}

/** The auth posture an existing connection carries. */
function authPostureFromConnection(connection: ConnectionConfig): AuthPosture {
  const awsAuthEnabled = Boolean(connection.awsAuthEnabled);
  return {
    awsAuthEnabled,
    awsRegion: awsAuthEnabled ? (connection.awsRegion ?? "") : "",
    serviceType: awsAuthEnabled
      ? (connection.serviceType ?? DEFAULT_SERVICE_TYPE)
      : undefined,
  };
}

function authPosturesMatch(a: AuthPosture, b: AuthPosture): boolean {
  return (
    a.awsAuthEnabled === b.awsAuthEnabled &&
    a.awsRegion === b.awsRegion &&
    a.serviceType === b.serviceType
  );
}

/**
 * Find an existing connection matching the link's identity: graphDbUrl
 * (case-insensitive) + queryEngine + auth posture (IAM on/off, region, and
 * service type). Auth posture is identity-bearing so a link requesting IAM
 * never silently reuses a plaintext connection to the same endpoint (or vice
 * versa) — a mismatch falls through to the editable create form instead.
 *
 * When several connections match, resolve in priority order: the active
 * connection (so a URL targeting it is a no-op), then a connection whose label
 * matches the `name` param, then the first match found.
 */
export function findMatchingConnection(
  configurations: Map<ConfigurationId, RawConfiguration>,
  params: UrlConnectionParams,
  activeId: ConfigurationId | null = null,
): RawConfiguration | null {
  const linkAuthPosture = authPostureFromParams(params);
  const matches = configurations
    .values()
    .filter(
      config =>
        config.connection?.graphDbUrl?.toLowerCase() ===
          params.graphDbUrl.toLowerCase() &&
        config.connection?.queryEngine === params.queryEngine &&
        authPosturesMatch(
          authPostureFromConnection(config.connection),
          linkAuthPosture,
        ),
    )
    .toArray();

  if (matches.length === 0) {
    return null;
  }

  const activeMatch = matches.find(config => config.id === activeId);
  const nameMatch = matches.find(config => config.displayLabel === params.name);

  return activeMatch ?? nameMatch ?? matches[0];
}

/**
 * The base URL of the proxy server that connection links target, derived from
 * the document base URI. The UI is served one level below the proxy API (static
 * files at `<base>/explorer/`, API routes at `<base>/`), so climbing one level
 * recovers the proxy root for every deployment: `https://host` for a root-hosted
 * app and `https://host/proxy/9250` for a path-hosted Neptune notebook.
 */
export function deriveProxyBaseUrl(baseURI: string): string {
  return new URL("..", baseURI).href.replace(/\/$/, "");
}

/**
 * Build the connection a link proposes. IAM auth is enabled whenever a region is
 * provided, defaulting the service type rather than silently leaving auth off
 * when only a region is given.
 *
 * Returns the connection body without an id, because a link only ever proposes a
 * connection. `CreateConnection` mints the id if and when the user saves the
 * form, so generating one here would produce a value nothing reads.
 */
export function buildConnectionFromParams(
  params: UrlConnectionParams,
  proxyBaseUrl: string,
): ConnectionConfig {
  const { awsAuthEnabled, awsRegion, serviceType } =
    authPostureFromParams(params);
  return {
    url: proxyBaseUrl,
    queryEngine: params.queryEngine,
    proxyConnection: true,
    graphDbUrl: params.graphDbUrl,
    awsAuthEnabled,
    awsRegion,
    serviceType,
  };
}

/**
 * The action a connection link resolves to, given the current connections.
 * Callers dispatch on `kind` rather than juggling match/pending booleans.
 *
 * `activate` names a connection the user already has, so it carries the stored
 * configuration, id and all. `create` only proposes one, so it carries the
 * connection body and the name to seed the form with, and nothing exists yet to
 * have an id.
 */
export type UrlConnectionIntent =
  | { kind: "none" }
  | { kind: "invalid"; error: ConnectionLinkError }
  | { kind: "activate"; connection: RawConfiguration }
  | { kind: "create"; name: string; connection: ConnectionConfig };

/**
 * Resolve a connection link into a single intent:
 * - no link, or one matching the active connection → `none` (nothing to do)
 * - matches an inactive connection → `activate` it
 * - no match → `create` a new connection seeded from the link
 * - the link failed validation → `invalid`, carrying what was wrong with it
 */
export function resolveUrlConnectionIntent(
  link: ConnectionLink,
  configurations: Map<ConfigurationId, RawConfiguration>,
  activeId: ConfigurationId | null,
  proxyBaseUrl: string,
): UrlConnectionIntent {
  if (link.kind === "absent") {
    return { kind: "none" };
  }
  if (link.kind === "invalid") {
    return { kind: "invalid", error: link.error };
  }

  const match = findMatchingConnection(configurations, link.params, activeId);

  if (match) {
    return match.id === activeId
      ? { kind: "none" }
      : { kind: "activate", connection: match };
  }

  return {
    kind: "create",
    name: link.params.name,
    connection: buildConnectionFromParams(link.params, proxyBaseUrl),
  };
}
