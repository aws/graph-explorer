import type { IncomingHttpHeaders } from "http";

import { Sha256 } from "@aws-crypto/sha256-js";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { logLevelOptions } from "@graph-explorer/shared/types";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import express, { type NextFunction, type Response } from "express";
import fetch, { type RequestInit } from "node-fetch";
import path from "path";
import { pipeline } from "stream";
import { z } from "zod";

import { errorHandlingMiddleware } from "./error-handler.ts";
import { RequestValidationError } from "./errors.ts";
import {
  type AppLogger,
  CLIENT_LOG_PATH,
  requestLoggingMiddleware,
} from "./logging.ts";
import { assertPermittedDbOrigin } from "./permitted-db-origins.ts";
import { createRateLimiter } from "./rate-limiter.ts";

const DEFAULT_SERVICE_TYPE = "neptune-db";

/**
 * Resolves a relative endpoint path against a base URL, preserving the base
 * path. Forces a trailing slash on the base so that `new URL` appends rather
 * than replaces the path.
 *
 * Throws if the resolved URL escapes the base origin (prevents SSRF via
 * crafted endpoint strings).
 */
export function resolveEndpointUrl<T extends string>(
  base: string,
  endpoint: T extends `/${string}` ? never : T,
): URL {
  const baseUrl = new URL(base.replace(/\/?$/, "/"));
  const resolved = new URL(endpoint, baseUrl);
  if (resolved.origin !== baseUrl.origin) {
    throw new Error(
      `Resolved URL origin "${resolved.origin}" does not match base "${baseUrl.origin}"`,
    );
  }
  return resolved;
}

/**
 * True when the database URL carries no userinfo.
 *
 * node-fetch refuses to build a request from a URL with an embedded username
 * or password, so such a connection has never been able to run a query.
 * Failing the request while it is still a header means the value is never
 * turned into a `URL` and never reaches a request.
 */
function hasNoEmbeddedCredentials(value: string) {
  try {
    const url = new URL(value);
    return !url.username && !url.password;
  } catch {
    // Not a URL at all; the format check reports that on its own.
    return true;
  }
}

/** Zod schema for the custom headers expected on database query requests. */
const DbQueryHeadersSchema = z.object({
  queryid: z.string().optional(),
  "graph-db-connection-url": z
    .url({ protocol: /^https?$/ })
    .refine(hasNoEmbeddedCredentials, {
      message: "Must not include a username or password",
    }),
  "aws-neptune-region": z.string().optional(),
  "service-type": z
    .enum(["neptune-db", "neptune-graph"])
    .optional()
    .default(DEFAULT_SERVICE_TYPE),
  "db-query-logging-enabled": z.stringbool().optional().default(false),
});

const CLIENT_LOG_MESSAGE_MAX_LENGTH = 10_000;

/** Requests to the client log route accepted per minute across all callers. */
const CLIENT_LOG_RATE_LIMIT = 300;

/** Zod schema for the JSON body of a log entry sent by the browser. */
const ClientLogBodySchema = z.object({
  level: z.enum(logLevelOptions),
  message: z.string().min(1).max(CLIENT_LOG_MESSAGE_MAX_LENGTH),
});

/**
 * Validates and extracts database query headers. Throws
 * {@link RequestValidationError} on malformed headers and `HttpError`
 * 403 when the database origin is not permitted.
 */
function parseDbQueryHeaders(
  headers: IncomingHttpHeaders,
  allowedDbOrigins: Set<string> | undefined,
) {
  const result = DbQueryHeadersSchema.safeParse(headers);
  if (!result.success) {
    throw new RequestValidationError(result.error);
  }
  const parsed = result.data;
  assertPermittedDbOrigin(parsed["graph-db-connection-url"], allowedDbOrigins);

  const authOptions = parsed["aws-neptune-region"]
    ? {
        isIamEnabled: true,
        region: parsed["aws-neptune-region"],
        serviceType: parsed["service-type"],
      }
    : {
        isIamEnabled: false,
        region: "",
        serviceType: "",
      };

  return {
    queryId: parsed.queryid,
    graphDbConnectionUrl: parsed["graph-db-connection-url"],
    shouldLogDbQuery: parsed["db-query-logging-enabled"],
    ...authOptions,
  };
}

interface CreateAppOptions {
  configPath: string;
  staticFilesVirtualPath: string;
  staticFilesPath: string;
  version?: string;
  corsOrigin?: string[];
  allowedDbOrigins?: Set<string>;
}

export function createApp({
  configPath,
  staticFilesVirtualPath,
  staticFilesPath,
  version,
  corsOrigin,
  allowedDbOrigins,
}: CreateAppOptions): express.Express {
  const app = express();

  app.use(requestLoggingMiddleware());
  app.use(compression());
  if (corsOrigin) {
    app.use(
      cors({
        origin: corsOrigin.length === 1 ? corsOrigin[0] : corsOrigin,
        methods: ["GET", "POST"],
        maxAge: 86400,
      }),
    );
  }
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
  app.use(
    "/defaultConnection",
    express.static(path.join(configPath, "defaultConnection.json")),
  );

  // Host the Graph Explorer UI static files. express.static's built-in
  // redirect sends an absolute Location, e.g. "/explorer/", for a request to
  // the bare mount path, which throws the browser out of any reverse-proxy
  // prefix unless the proxy rewrites the header. Issue a relative Location
  // instead so the browser resolves it against its own URL and keeps the
  // prefix. Express matches a route path and its trailing-slash form as the
  // same route, so the already-correct form falls through to the static
  // middleware rather than redirecting again.
  // The target is the last segment of the mount path, so a multi-segment
  // mount resolves correctly too: from "/a/b", "b/" resolves to "/a/b/".
  const mountSegment = staticFilesVirtualPath.slice(
    staticFilesVirtualPath.lastIndexOf("/") + 1,
  );
  app.get(staticFilesVirtualPath, (req, res, next) => {
    if (req.path.endsWith("/")) {
      next();
      return;
    }
    res.redirect(301, `${mountSegment}/`);
  });
  app.use(
    staticFilesVirtualPath,
    express.static(staticFilesPath, { redirect: false }),
  );

  function getLogger(): AppLogger {
    return app.locals.logger;
  }

  // One signer reused across requests. It holds the SDK's node provider chain,
  // which memoizes credentials, refreshes them near expiry, and single-flights
  // concurrent refreshes. Region and service vary per request, so they are
  // passed as sign() overrides rather than fixed on the signer.
  const signer = new SignatureV4({
    service: DEFAULT_SERVICE_TYPE,
    region: "",
    credentials: fromNodeProviderChain(),
    sha256: Sha256,
  });

  const userAgent = version ? `graph-explorer/${version}` : "graph-explorer";

  // Once per app rather than per origin: the client picks the origin, so
  // per-origin state would grow without bound.
  let hasWarnedSigningWithoutAllowlist = false;

  function warnOnceIfSigningWithoutAllowlist(url: URL) {
    if (allowedDbOrigins || hasWarnedSigningWithoutAllowlist) {
      return;
    }
    hasWarnedSigningWithoutAllowlist = true;
    getLogger().warn(
      `Signed a request to ${url.origin} with no Database Origin Allowlist set. ` +
        "The Proxy Server signs with its own AWS identity, which every user of this deployment shares, " +
        "so any user can reach any database that identity's policy allows. " +
        "Set PROXY_SERVER_ALLOWED_DB_ORIGINS or scope the identity's database policy. " +
        "See the Graph Explorer security documentation for details.",
    );
  }

  // node-fetch derives the request line from the URL, so only request-init
  // fields are returned; the fields fed to the signer are signing inputs only.
  async function buildFetchOptions(
    url: URL,
    options: any,
    isIamEnabled: boolean,
    region: string | undefined,
    serviceType: string,
  ): Promise<RequestInit> {
    let headers = options.headers;
    if (isIamEnabled) {
      const signed = await signer.sign(
        new HttpRequest({
          method: options.method,
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? Number(url.port) : undefined,
          path: url.pathname,
          // Signed queries are single-valued by construction — the proxy's
          // fixed endpoints only ever set mode, cancelQuery, or queryId once.
          // Revisit if a repeated-key query is ever added (fromEntries would
          // drop all but the last, diverging from the signed request).
          query: Object.fromEntries(url.searchParams),
          headers: { ...options.headers, host: url.host },
          body: options.body ?? undefined,
        }),
        { signingRegion: region, signingService: serviceType },
      );
      headers = signed.headers;
      warnOnceIfSigningWithoutAllowlist(url);
    }
    return {
      method: options.method,
      body: options.body ?? undefined,
      headers,
      compress: false,
      redirect: "error",
    };
  }

  // Function to retry fetch requests with exponential backoff.
  const retryFetch = async (
    url: URL,
    options: any,
    isIamEnabled: boolean,
    region: string | undefined,
    serviceType: string,
    retryDelay = 10000,
    refetchMaxRetries = 1,
  ) => {
    const logger = getLogger();
    for (let i = 0; i < refetchMaxRetries; i++) {
      const fetchOptions = await buildFetchOptions(
        url,
        options,
        isIamEnabled,
        region,
        serviceType,
      );

      try {
        const res = await fetch(url.href, fetchOptions);
        if (!res.ok) {
          logger.error("!!Request failure!!");
        }
        return res;
      } catch (err) {
        if (refetchMaxRetries === 1) {
          // Don't log about retries if retrying is not used
          throw err;
        } else if (i === refetchMaxRetries - 1) {
          logger.error(err, "!!Proxy Retry Fetch Reached Maximum Tries!!");
          throw err;
        } else {
          logger.debug("Proxy Retry Fetch Count::: " + i);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    // Should never reach this code
    throw new Error("retryFetch failed to complete retry logic");
  };

  // Function to fetch data from the given URL and send it as a response.
  async function fetchData(
    res: Response,
    next: NextFunction,
    url: string,
    options: RequestInit,
    isIamEnabled: boolean,
    region: string | undefined,
    serviceType: string,
  ) {
    const logger = getLogger();
    try {
      const response = await retryFetch(
        new URL(url),
        {
          ...options,
          headers: {
            "User-Agent": userAgent,
            ...Object.fromEntries(new Headers(options.headers as HeadersInit)),
          },
        },
        isIamEnabled,
        region,
        serviceType,
      );

      // Only forward content headers from the upstream response.
      // All other headers (CORS, hop-by-hop, server info) are dropped
      // to avoid conflicts with the proxy's own response handling.
      res.status(response.status);
      for (const header of ["content-type", "content-encoding"]) {
        const value = response.headers.get(header);
        if (value) {
          res.setHeader(header, value);
        }
      }

      // Pipe the raw fetch response body directly to the client response
      if (response.body) {
        pipeline(response.body, res, err => {
          if (err) {
            // Log the error as a warning, but otherwise ignore it
            logger.warn("Pipeline error %o", err);
          }
        });
      } else {
        res.end();
      }
    } catch (error) {
      next(error);
    }
  }

  // POST endpoint for SPARQL queries.
  app.post("/sparql", async (req, res, next) => {
    const logger = getLogger();
    const {
      queryId,
      graphDbConnectionUrl,
      shouldLogDbQuery,
      isIamEnabled,
      region,
      serviceType,
    } = parseDbQueryHeaders(req.headers, allowedDbOrigins);

    /// Function to cancel long running queries if the client disappears before completion
    async function cancelQuery() {
      if (!queryId) {
        return;
      }
      logger.debug(`Cancelling request ${queryId}...`);
      try {
        const statusUrl = resolveEndpointUrl(
          graphDbConnectionUrl,
          "sparql/status",
        );
        await retryFetch(
          statusUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: `cancelQuery&queryId=${encodeURIComponent(queryId)}&silent=true`,
          },
          isIamEnabled,
          region,
          serviceType,
        );
      } catch (err) {
        // Not really an error
        logger.warn(err, "Failed to cancel the query");
      }
    }

    // Watch for a cancelled or aborted connection
    req.on("close", async () => {
      if (req.complete) {
        return;
      }

      await cancelQuery();
    });
    res.on("close", async () => {
      if (res.writableFinished) {
        return;
      }
      await cancelQuery();
    });

    // Validate the input before making any external calls.
    const queryString = req.body.query;
    if (!queryString) {
      res.status(400).send({ error: "[Proxy]SPARQL: Query not provided" });
      return;
    }

    if (shouldLogDbQuery) {
      logger.debug("[SPARQL] Received database query:\n%s", queryString);
    }

    const rawUrl = resolveEndpointUrl(graphDbConnectionUrl, "sparql").href;
    let body = `query=${encodeURIComponent(queryString)}`;
    if (queryId) {
      body += `&queryId=${encodeURIComponent(queryId)}`;
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
      body,
    };

    await fetchData(
      res,
      next,
      rawUrl,
      requestOptions,
      isIamEnabled,
      region,
      serviceType,
    );
  });

  // POST endpoint for Gremlin queries.
  app.post("/gremlin", async (req, res, next) => {
    const logger = getLogger();
    const {
      queryId,
      graphDbConnectionUrl,
      shouldLogDbQuery,
      isIamEnabled,
      region,
      serviceType,
    } = parseDbQueryHeaders(req.headers, allowedDbOrigins);

    // Validate the input before making any external calls.
    const queryString = req.body.gremlin;
    if (!queryString) {
      res.status(400).send({ error: "[Proxy] Gremlin: query not provided" });
      return;
    }

    if (shouldLogDbQuery) {
      logger.debug("[Gremlin] Received database query:\n%s", queryString);
    }

    /// Function to cancel long running queries if the client disappears before completion
    async function cancelQuery() {
      if (!queryId) {
        return;
      }
      logger.debug(`Cancelling request ${queryId}...`);
      try {
        const cancelUrl = resolveEndpointUrl(
          graphDbConnectionUrl,
          "gremlin/status",
        );
        cancelUrl.searchParams.set("cancelQuery", "");
        cancelUrl.searchParams.set("queryId", queryId);
        await retryFetch(
          cancelUrl,
          { method: "GET" },
          isIamEnabled,
          region,
          serviceType,
        );
      } catch (err) {
        // Not really an error
        logger.warn(err, "Failed to cancel the query");
      }
    }

    // Watch for a cancelled or aborted connection
    req.on("close", async () => {
      if (req.complete) {
        return;
      }
      await cancelQuery();
    });
    res.on("close", async () => {
      if (res.writableFinished) {
        return;
      }
      await cancelQuery();
    });

    const body = { gremlin: queryString, queryId };
    const rawUrl = resolveEndpointUrl(graphDbConnectionUrl, "gremlin").href;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.gremlin-v3.0+json",
      },
      body: JSON.stringify(body),
    };

    await fetchData(
      res,
      next,
      rawUrl,
      requestOptions,
      isIamEnabled,
      region,
      serviceType,
    );
  });

  // POST endpoint for openCypher queries.
  app.post("/openCypher", async (req, res, next) => {
    const logger = getLogger();
    const {
      graphDbConnectionUrl,
      shouldLogDbQuery,
      isIamEnabled,
      region,
      serviceType,
    } = parseDbQueryHeaders(req.headers, allowedDbOrigins);

    const queryString = req.body.query;
    // Validate the input before making any external calls.
    if (!queryString) {
      res.status(400).send({ error: "[Proxy]OpenCypher: query not provided" });
      return;
    }

    if (shouldLogDbQuery) {
      logger.debug("[openCypher] Received database query:\n%s", queryString);
    }

    const openCypherUrl = resolveEndpointUrl(
      graphDbConnectionUrl,
      "openCypher",
    ).href;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: `query=${encodeURIComponent(queryString)}`,
    };

    await fetchData(
      res,
      next,
      openCypherUrl,
      requestOptions,
      isIamEnabled,
      region,
      serviceType,
    );
  });

  // GET endpoint to retrieve PropertyGraph statistics summary for Neptune Analytics.
  app.get("/summary", async (req, res, next) => {
    const { graphDbConnectionUrl, isIamEnabled, region, serviceType } =
      parseDbQueryHeaders(req.headers, allowedDbOrigins);
    const rawUrl = resolveEndpointUrl(
      graphDbConnectionUrl,
      "summary?mode=basic",
    ).href;

    await fetchData(
      res,
      next,
      rawUrl,
      { method: "GET" },
      isIamEnabled,
      region,
      serviceType,
    );
  });

  // GET endpoint to retrieve PropertyGraph statistics summary for Neptune DB.
  app.get("/pg/statistics/summary", async (req, res, next) => {
    const { graphDbConnectionUrl, isIamEnabled, region, serviceType } =
      parseDbQueryHeaders(req.headers, allowedDbOrigins);
    const rawUrl = resolveEndpointUrl(
      graphDbConnectionUrl,
      "pg/statistics/summary?mode=basic",
    ).href;

    await fetchData(
      res,
      next,
      rawUrl,
      { method: "GET" },
      isIamEnabled,
      region,
      serviceType,
    );
  });

  // GET endpoint to retrieve RDF statistics summary.
  app.get("/rdf/statistics/summary", async (req, res, next) => {
    const { graphDbConnectionUrl, isIamEnabled, region, serviceType } =
      parseDbQueryHeaders(req.headers, allowedDbOrigins);
    const rawUrl = resolveEndpointUrl(
      graphDbConnectionUrl,
      "rdf/statistics/summary?mode=basic",
    ).href;

    await fetchData(
      res,
      next,
      rawUrl,
      { method: "GET" },
      isIamEnabled,
      region,
      serviceType,
    );
  });

  app.get("/status", (_req, res) => {
    res.send("OK");
  });

  const clientLogLimiter = createRateLimiter({
    limit: CLIENT_LOG_RATE_LIMIT,
    windowMs: 60_000,
  });

  app.post(CLIENT_LOG_PATH, (req, res) => {
    // Responds directly: the error middleware would log every rejected request.
    if (req.headers["content-type"] && req.is("application/json") === false) {
      res.status(415).send({
        error: {
          status: 415,
          message: "Content-Type must be application/json.",
        },
      });
      return;
    }

    if (!clientLogLimiter.tryConsume()) {
      res.status(429).send({
        error: {
          status: 429,
          message: "Too many client log requests. Try again later.",
        },
      });
      return;
    }

    const result = ClientLogBodySchema.safeParse(req.body);
    if (!result.success) {
      throw new RequestValidationError(result.error);
    }
    const { level, message } = result.data;

    // A structured field keeps a multi-line message in one log entry.
    getLogger()[level]({ source: "client", clientLog: message }, "client log");
    res.send("Log received.");
  });

  // Error handler middleware to log errors and send appropriate response.
  app.use(errorHandlingMiddleware());

  app.use((_req, res) => {
    res.status(404).send("The requested resource was not available");
  });

  return app;
}
