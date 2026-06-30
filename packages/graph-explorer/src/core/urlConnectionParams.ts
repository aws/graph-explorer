import {
  type ConnectionConfig,
  type NeptuneServiceType,
  neptuneServiceTypeOptions,
  queryEngineOptions,
} from "@shared/types";
import { z } from "zod";

import { DEFAULT_SERVICE_TYPE } from "@/utils";

import {
  type ConfigurationId,
  createNewConfigurationId,
  type RawConfiguration,
} from "./ConfigurationProvider";

const UrlConnectionParamsSchema = z.object({
  // Only http(s) endpoints are meaningful, and constraining the scheme keeps a
  // crafted link from seeding the form with something like `javascript:` —
  // defense in depth on top of the editable create form and proxy allowlist.
  graphDbUrl: z.url({ protocol: /^https?$/ }),
  queryEngine: z.enum(queryEngineOptions).catch("gremlin"),
  awsRegion: z.string().default(""),
  serviceType: z.enum(neptuneServiceTypeOptions).optional().catch(undefined),
  name: z.string().optional(),
});

export type UrlConnectionParams = z.infer<typeof UrlConnectionParamsSchema> & {
  name: string;
};

/**
 * Whether the search string carries a connection link at all (a `graphDbUrl` is
 * present, valid or not). Lets callers tell "this isn't a connection link" apart
 * from "this is a connection link with invalid data", which `parseUrlConnectionParams`
 * collapses into a single `null`.
 */
export function hasConnectionLinkParams(search: string): boolean {
  return Boolean(new URLSearchParams(search).get("graphDbUrl"));
}

/**
 * Parse URL search params into connection params. Returns null when there is no
 * `graphDbUrl`, or when it is not a valid http(s) URL.
 */
export function parseUrlConnectionParams(
  search: string,
): UrlConnectionParams | null {
  const params = new URLSearchParams(search);
  const graphDbUrl = params.get("graphDbUrl");
  if (!graphDbUrl) return null;

  const parsed = UrlConnectionParamsSchema.safeParse({
    graphDbUrl,
    queryEngine: params.get("queryEngine") ?? undefined,
    awsRegion: params.get("awsRegion") ?? undefined,
    serviceType: params.get("serviceType") ?? undefined,
    name: params.get("name") ?? undefined,
  });
  if (!parsed.success) return null;

  return {
    ...parsed.data,
    name: parsed.data.name ?? deriveNameFromUrl(graphDbUrl),
  };
}

/**
 * Derives a connection name from a database URL by taking the full hostname
 * (without scheme or port), which the user can recognize at a glance. The URL
 * is already validated as http(s) by the time this runs, so `new URL` is safe.
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
 * Build a RawConfiguration from URL params. IAM auth is enabled whenever a
 * region is provided, defaulting the service type rather than silently leaving
 * auth off when only a region is given.
 */
export function buildConnectionFromParams(
  params: UrlConnectionParams,
  proxyBaseUrl: string,
): RawConfiguration {
  const { awsAuthEnabled, awsRegion, serviceType } =
    authPostureFromParams(params);
  return {
    id: createNewConfigurationId(),
    displayLabel: params.name,
    connection: {
      url: proxyBaseUrl,
      queryEngine: params.queryEngine,
      proxyConnection: true,
      graphDbUrl: params.graphDbUrl,
      awsAuthEnabled,
      awsRegion,
      serviceType,
    },
  };
}

/**
 * The action a set of URL connection params resolves to, given the current
 * connections. Callers dispatch on `kind` rather than juggling match/pending
 * booleans.
 */
export type UrlConnectionIntent =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "activate"; connection: RawConfiguration }
  | { kind: "create"; connection: RawConfiguration };

/**
 * Resolve URL params into a single intent:
 * - matches the active connection → `none` (nothing to do)
 * - matches an inactive connection → `activate` it
 * - no match → `create` a new connection seeded from the params
 */
export function resolveUrlConnectionIntent(
  params: UrlConnectionParams,
  configurations: Map<ConfigurationId, RawConfiguration>,
  activeId: ConfigurationId | null,
  proxyBaseUrl: string,
): UrlConnectionIntent {
  const match = findMatchingConnection(configurations, params, activeId);

  if (match) {
    return match.id === activeId
      ? { kind: "none" }
      : { kind: "activate", connection: match };
  }

  return {
    kind: "create",
    connection: buildConnectionFromParams(params, proxyBaseUrl),
  };
}
