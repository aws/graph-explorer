import {
  type ConnectionConfig,
  type NeptuneServiceType,
  neptuneServiceTypeOptions,
  type QueryEngine,
  queryEngineOptions,
} from "@shared/types";
import { z } from "zod";

import { DEFAULT_SERVICE_TYPE } from "@/utils";

import type {
  ConfigurationId,
  RawConfiguration,
} from "./ConfigurationProvider";

import { ConnectionLinkError } from "./connectionLinkError";
import { normalizeConnection } from "./StateProvider/configuration";

/** Matches `us-east-1`, `us-gov-west-1`, `ap-southeast-2`, `cn-north-1`, etc. */
const AWS_REGION_PATTERN = /^[a-z]{2}(-[a-z]+)+-\d+$/;

/**
 * Every message is phrased to follow the parameter's own name, so a failure
 * reads back to the user as the requirement it broke: "graphDbUrl must be a
 * valid http or https URL".
 */
const ConnectionLinkParamsSchema = z
  .object({
    // Only http(s) endpoints are meaningful, and constraining the scheme keeps a
    // crafted link from seeding the form with something like `javascript:`.
    //
    // Credentials in the URL are refused by `fetch` itself (the Request
    // constructor throws on them), so a link carrying them could only build a
    // connection that fails every query, after persisting the password to
    // IndexedDB and into any exported connection file. Graph Explorer
    // authenticates with IAM, never userinfo.
    // The `#/connect` route exists only for connection links, so reaching it
    // without a graphDbUrl (missing entirely, or present but empty) is an
    // invalid link rather than a silent no-op — the caller asked to open a
    // link and the one param that makes it a link isn't there.
    graphDbUrl: z
      .string()
      .min(1, { error: "is required" })
      .pipe(
        z.url({
          protocol: /^https?$/,
          error: "must be a valid http or https URL",
        }),
      )
      .refine(value => !hasCredentials(value), {
        error: "cannot include a username or password",
      })
      .refine(hasNoBackslash, {
        error: "cannot contain a backslash",
      }),
    // Absent values take a default, but an explicit value we do not support is a
    // rejection rather than a coercion: silently answering `queryEngine=sql` with
    // Gremlin would build a connection that queries the database in a language the
    // caller never asked for. The default itself depends on `serviceType`
    // (Neptune Analytics only speaks openCypher), so it is resolved below
    // rather than here.
    queryEngine: z
      .enum(queryEngineOptions, { error: mustBeOneOf(queryEngineOptions) })
      .optional(),
    // Absent or empty still means IAM off; a non-empty value must actually
    // look like an AWS region, since anything else can only produce SigV4
    // requests signed for a region that doesn't exist.
    awsRegion: z
      .string()
      .refine(value => value === "" || AWS_REGION_PATTERN.test(value), {
        error: 'must be an AWS region like "us-east-1"',
      })
      .default(""),
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
  })
  // Neptune Analytics (`neptune-graph`) only speaks openCypher. An explicit
  // `queryEngine` naming anything else is a rejection, same as any other
  // unsupported explicit value; an absent one defaults to openCypher instead
  // of the general gremlin default.
  .superRefine((data, ctx) => {
    if (
      data.serviceType === "neptune-graph" &&
      data.queryEngine !== undefined &&
      data.queryEngine !== "openCypher"
    ) {
      ctx.addIssue({
        code: "custom",
        message: 'must be "openCypher" when serviceType is "neptune-graph"',
        path: ["queryEngine"],
      });
    }
  })
  // A nameless link takes the hostname `deriveNameFromUrl` would have produced,
  // so `name` is always a usable display label after parsing.
  .transform(data => ({
    ...data,
    queryEngine:
      data.queryEngine ??
      (data.serviceType === "neptune-graph" ? "openCypher" : "gremlin"),
    name: data.name ?? deriveNameFromUrl(data.graphDbUrl),
  }));

function mustBeOneOf(options: readonly string[]): string {
  return `must be one of ${options.map(option => `"${option}"`).join(", ")}`;
}

export type ConnectionLinkParams = z.infer<typeof ConnectionLinkParamsSchema>;

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
 * WHATWG URL parsing reads a backslash as `/` in http(s) URLs, so
 * `https://evil.tld\@prod.neptune.amazonaws.com` resolves to `evil.tld` while
 * reading as a Neptune host. The create form shows the raw string, so it has
 * to name the host that is actually contacted.
 */
function hasNoBackslash(graphDbUrl: string): boolean {
  return !graphDbUrl.includes("\\");
}

/**
 * What a route's search string carries. There is no "absent" kind: the
 * `#/connect` route exists only for connection links, so reaching it without
 * a `graphDbUrl` is an invalid link (missing the one param that makes it a
 * link) rather than a distinct, silent case.
 */
export type ConnectionLink =
  | { kind: "invalid"; error: ConnectionLinkError }
  | { kind: "valid"; params: ConnectionLinkParams };

/** Reads URL search params as a connection link. */
export function readConnectionLink(search: string): ConnectionLink {
  const params = new URLSearchParams(search);
  const parsed = ConnectionLinkParamsSchema.safeParse({
    graphDbUrl: params.get("graphDbUrl") ?? "",
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

  return { kind: "valid", params: parsed.data };
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
  return new URL(graphDbUrl).hostname;
}

/**
 * What makes two connections the same one for matching: graphDbUrl
 * (normalized and case-insensitive), queryEngine, and auth posture. Auth
 * posture is identity-bearing because a link requesting IAM in a given
 * region/service type is a *different* connection from a plaintext one to the
 * same endpoint, so it must not silently reuse it. When IAM is off, region and
 * service type carry no auth meaning and are normalized away.
 *
 * Both sides go through `normalizeConnection`, the same defaults the rest of
 * the app reads a stored connection with, so a stored connection with no
 * `queryEngine` is a gremlin connection here too.
 */
type ConnectionIdentity = {
  graphDbUrl: string;
  queryEngine: QueryEngine;
  awsAuthEnabled: boolean;
  awsRegion: string;
  serviceType: NeptuneServiceType | undefined;
};

function identityOf(connection: ConnectionConfig): ConnectionIdentity {
  const normalized = normalizeConnection(connection);
  const { awsAuthEnabled } = normalized;
  return {
    graphDbUrl: normalized.graphDbUrl.toLowerCase(),
    queryEngine: normalized.queryEngine,
    awsAuthEnabled,
    awsRegion: awsAuthEnabled ? (normalized.awsRegion ?? "") : "",
    serviceType: awsAuthEnabled
      ? (normalized.serviceType ?? DEFAULT_SERVICE_TYPE)
      : undefined,
  };
}

function identitiesMatch(
  a: ConnectionIdentity,
  b: ConnectionIdentity,
): boolean {
  return (
    a.graphDbUrl === b.graphDbUrl &&
    a.queryEngine === b.queryEngine &&
    a.awsAuthEnabled === b.awsAuthEnabled &&
    a.awsRegion === b.awsRegion &&
    a.serviceType === b.serviceType
  );
}

/**
 * Find an existing connection with the same {@link ConnectionIdentity} as the
 * one a link proposes. A mismatch falls through to the editable create form.
 *
 * When several connections match, resolve in priority order: the active
 * connection (so a URL targeting it is a no-op), then a connection whose label
 * matches the link's name, then the first match found.
 */
export function findMatchingConnection(
  configurations: Map<ConfigurationId, RawConfiguration>,
  proposed: ConnectionConfig,
  name: string,
  activeId: ConfigurationId | null,
): RawConfiguration | null {
  const proposedIdentity = identityOf(proposed);
  const matches = configurations
    .values()
    .filter(
      config =>
        config.connection != null &&
        identitiesMatch(identityOf(config.connection), proposedIdentity),
    )
    .toArray();

  if (matches.length === 0) {
    return null;
  }

  const activeMatch = matches.find(config => config.id === activeId);
  const nameMatch = matches.find(config => config.displayLabel === name);

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
 * Build the connection a link proposes. IAM auth is enabled exactly when a
 * region is provided, defaulting the service type when only a region is given.
 * A `serviceType` without a region still carries through, since it also picks
 * the query engine and the summary API, and seeds the form if the user turns
 * IAM on.
 *
 * Returns the connection body without an id, because a link only ever proposes a
 * connection. `CreateConnection` mints the id if and when the user saves the
 * form, so generating one here would produce a value nothing reads.
 */
export function buildConnectionFromParams(
  params: ConnectionLinkParams,
  proxyBaseUrl: string,
): ConnectionConfig {
  const awsAuthEnabled = Boolean(params.awsRegion);
  return {
    url: proxyBaseUrl,
    queryEngine: params.queryEngine,
    proxyConnection: true,
    graphDbUrl: params.graphDbUrl,
    awsAuthEnabled,
    awsRegion: params.awsRegion,
    serviceType:
      params.serviceType ?? (awsAuthEnabled ? DEFAULT_SERVICE_TYPE : undefined),
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
export type ConnectionLinkIntent =
  | { kind: "none" }
  | { kind: "invalid"; error: ConnectionLinkError }
  | { kind: "activate"; connection: RawConfiguration }
  | { kind: "create"; name: string; connection: ConnectionConfig };

/**
 * Resolve a connection link into a single intent:
 * - matches the active connection → `none` (nothing to do)
 * - matches an inactive connection → `activate` it
 * - no match → `create` a new connection seeded from the link
 * - the link failed validation (including a missing `graphDbUrl`) → `invalid`,
 *   carrying what was wrong with it
 */
export function resolveConnectionLinkIntent(
  link: ConnectionLink,
  configurations: Map<ConfigurationId, RawConfiguration>,
  activeId: ConfigurationId | null,
  proxyBaseUrl: string,
): ConnectionLinkIntent {
  if (link.kind === "invalid") {
    return { kind: "invalid", error: link.error };
  }

  const proposed = buildConnectionFromParams(link.params, proxyBaseUrl);
  const match = findMatchingConnection(
    configurations,
    proposed,
    link.params.name,
    activeId,
  );

  if (match) {
    return match.id === activeId
      ? { kind: "none" }
      : { kind: "activate", connection: match };
  }

  return { kind: "create", name: link.params.name, connection: proposed };
}
