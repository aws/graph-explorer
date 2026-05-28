import type { IncomingHttpHeaders } from "http";

import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import aws4 from "aws4";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import express, { type NextFunction, type Response } from "express";
import fetch, { type RequestInit } from "node-fetch";
import path from "path";
import { pipeline } from "stream";
import { z } from "zod";

import { assertAllowedDbOrigin } from "./allowed-db-origins.ts";
import { errorHandlingMiddleware } from "./error-handler.ts";
import { RequestValidationError } from "./errors.ts";
import { type AppLogger, requestLoggingMiddleware } from "./logging.ts";

const DEFAULT_SERVICE_TYPE = "neptune-db";

/**
 * Resolves an endpoint path against a base URL, preserving the base path.
 * Strips any leading slash from the endpoint and forces a trailing slash on
 * the base so that `new URL` appends rather than replaces the path.
 *
 * Throws if the resolved URL escapes the base origin (prevents SSRF via
 * crafted endpoint strings).
 */
export function resolveEndpointUrl(base: string, endpoint: string): URL {
  const relative = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const baseUrl = new URL(base.replace(/\/?$/, "/"));
  const resolved = new URL(relative, baseUrl);
  if (resolved.origin !== baseUrl.origin) {
    throw new Error(
      `Resolved URL origin "${resolved.origin}" does not match base "${baseUrl.origin}"`,
    );
  }
  return resolved;
}

/** Zod schema for the custom headers expected on database query requests. */
const DbQueryHeadersSchema = z.object({
  queryid: z.string().optional(),
  "graph-db-connection-url": z.url({ protocol: /^https?$/ }),
  "aws-neptune-region": z.string().optional(),
  "service-type": z
    .enum(["neptune-db", "neptune-graph"])
    .optional()
    .default(DEFAULT_SERVICE_TYPE),
  "db-query-logging-enabled": z.stringbool().optional().default(false),
});

/** Validates and extracts database query headers. Throws {@link RequestValidationError} on failure. */
function parseDbQueryHeaders(headers: IncomingHttpHeaders) {
  const result = DbQueryHeadersSchema.safeParse(headers);
  if (!result.success) {
    throw new RequestValidationError(result.error);
  }
  const parsed = result.data;

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

interface LoggerIncomingHttpHeaders extends IncomingHttpHeaders {
  level?: string;
  message?: string;
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

  // Host the Graph Explorer UI static files
  app.use(staticFilesVirtualPath, express.static(staticFilesPath));

  function getLogger(): AppLogger {
    return app.locals.logger;
  }

  // Function to get IAM headers for AWS4 signing process.
  async function getIAMHeaders(options: string | aws4.Request) {
    const credentialProvider = fromNodeProviderChain();
    const creds = await credentialProvider();
    if (creds === undefined) {
      throw new Error(
        "IAM is enabled but credentials cannot be found on the credential provider chain.",
      );
    }

    const headers = aws4.sign(options, {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      ...(creds.sessionToken && { sessionToken: creds.sessionToken }),
    });

    return headers;
  }

  const userAgent = version ? `graph-explorer/${version}` : "graph-explorer";

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
      if (isIamEnabled) {
        const data = await getIAMHeaders({
          host: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          service: serviceType,
          region,
          method: options.method,
          body: options.body ?? undefined,
          headers: options.headers,
        });

        options = {
          host: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          service: serviceType,
          region,
          method: options.method,
          body: options.body ?? undefined,
          headers: data.headers,
        };
      }
      options = {
        host: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        service: serviceType,
        method: options.method,
        body: options.body ?? undefined,
        headers: options.headers,
        compress: false,
        redirect: "error",
      };

      try {
        const res = await fetch(url.href, options); // lgtm[js/request-forgery]
        if (!res.ok) {
          logger.error("!!Request failure!!");
          return res;
        } else {
          return res;
        }
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
    } = parseDbQueryHeaders(req.headers);
    assertAllowedDbOrigin(graphDbConnectionUrl, allowedDbOrigins);

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
    } = parseDbQueryHeaders(req.headers);
    assertAllowedDbOrigin(graphDbConnectionUrl, allowedDbOrigins);

    // Validate the input before making any external calls.
    const queryString = req.body.query;
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
    } = parseDbQueryHeaders(req.headers);
    assertAllowedDbOrigin(graphDbConnectionUrl, allowedDbOrigins);

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
      parseDbQueryHeaders(req.headers);
    assertAllowedDbOrigin(graphDbConnectionUrl, allowedDbOrigins);
    const rawUrl = resolveEndpointUrl(graphDbConnectionUrl, req.url).href;

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
      parseDbQueryHeaders(req.headers);
    assertAllowedDbOrigin(graphDbConnectionUrl, allowedDbOrigins);
    const rawUrl = resolveEndpointUrl(graphDbConnectionUrl, req.url).href;

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
      parseDbQueryHeaders(req.headers);
    assertAllowedDbOrigin(graphDbConnectionUrl, allowedDbOrigins);
    const rawUrl = resolveEndpointUrl(graphDbConnectionUrl, req.url).href;

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

  app.post("/logger", (req, res, next) => {
    const logger = getLogger();
    const headers = req.headers as LoggerIncomingHttpHeaders;
    let message;
    let level;
    try {
      if (headers["level"] === undefined) {
        throw new Error("No log level passed.");
      } else {
        level = headers["level"];
      }
      if (headers["message"] === undefined) {
        throw new Error("No log message passed.");
      } else {
        message = JSON.parse(headers["message"]).replaceAll("\\", "");
      }
      if (level.toLowerCase() === "error") {
        logger.error(message);
      } else if (level.toLowerCase() === "warn") {
        logger.warn(message);
      } else if (level.toLowerCase() === "info") {
        logger.info(message);
      } else if (level.toLowerCase() === "debug") {
        logger.debug(message);
      } else if (level.toLowerCase() === "trace") {
        logger.trace(message);
      } else {
        throw new Error("Tried to log to an unknown level.");
      }
      res.send("Log received.");
    } catch (error) {
      next(error);
    }
  });

  // Error handler middleware to log errors and send appropriate response.
  app.use(errorHandlingMiddleware());

  app.use((_req, res) => {
    res.status(404).send("The requested resource was not available");
  });

  return app;
}
