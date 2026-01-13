import express, { type NextFunction, type Response } from "express";
import cors from "cors";
import compression from "compression";
import fetch, { type RequestInit } from "node-fetch";
import https from "https";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import aws4 from "aws4";
import type { IncomingHttpHeaders } from "http";
import { logger as proxyLogger, requestLoggingMiddleware } from "./logging.js";
import { clientRoot, proxyServerRoot } from "./paths.js";
import { errorHandlingMiddleware, handleError } from "./error-handler.js";
import { BooleanStringSchema, env } from "./env.js";
import { pipeline } from "stream";

const app = express();

const DEFAULT_SERVICE_TYPE = "neptune-db";

interface DbQueryIncomingHttpHeaders extends IncomingHttpHeaders {
  queryid?: string;
  "graph-db-connection-url"?: string;
  "aws-neptune-region"?: string;
  "service-type"?: string;
  "db-query-logging-enabled"?: string;
}

interface LoggerIncomingHttpHeaders extends IncomingHttpHeaders {
  level?: string;
  message?: string;
}

app.use(requestLoggingMiddleware());

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
      compress: false, // prevent automatic decompression
    };

    try {
      const res = await fetch(url.href, options);
      if (!res.ok) {
        proxyLogger.error("!!Request failure!!");
        return res;
      } else {
        return res;
      }
    } catch (err) {
      if (refetchMaxRetries === 1) {
        // Don't log about retries if retrying is not used
        throw err;
      } else if (i === refetchMaxRetries - 1) {
        proxyLogger.error(err, "!!Proxy Retry Fetch Reached Maximum Tries!!");
        throw err;
      } else {
        proxyLogger.debug("Proxy Retry Fetch Count::: " + i);
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
  try {
    const response = await retryFetch(
      new URL(url),
      options,
      isIamEnabled,
      region,
      serviceType,
    );

    // Set the headers from the fetch response to the client response
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Pipe the raw fetch response body directly to the client response
    if (response.body) {
      pipeline(response.body, res, err => {
        if (err) {
          // Log the error as a warning, but otherwise ignore it
          proxyLogger.warn("Pipeline error %o", err);
        }
      });
    } else {
      res.end();
    }
  } catch (error) {
    next(error);
  }
}

const defaultConnectionFolderPath = env.CONFIGURATION_FOLDER_PATH
  ? env.CONFIGURATION_FOLDER_PATH
  : clientRoot;

app.use(compression()); // Use compression middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  "/defaultConnection",
  express.static(
    path.join(defaultConnectionFolderPath, "defaultConnection.json"),
  ),
);

// Serve the backup config file if it exists
const backupConfigPath = path.resolve(
  defaultConnectionFolderPath,
  "graph-explorer-config.json",
);
app.get("/graph-explorer-config.json", (_req, res) => {
  // Check if file exists before attempting to send it
  if (!fs.existsSync(backupConfigPath)) {
    res.status(404).send("Backup config file not found");
    return;
  }
  // Send file and handle any errors gracefully
  res.sendFile(backupConfigPath, err => {
    if (err) {
      // File was deleted or became inaccessible after the exists check
      if (!res.headersSent) {
        res.status(404).send("Backup config file not found");
      }
    }
  });
});
if (fs.existsSync(backupConfigPath)) {
  proxyLogger.info("Serving backup config file from: %s", backupConfigPath);
}

// Host the Graph Explorer UI static files
const staticFilesVirtualPath = "/explorer";
const staticFilesPath = path.join(clientRoot, "dist");

proxyLogger.info("Hosting client side static files from: %s", staticFilesPath);
proxyLogger.info(
  "Hosting client side static files at: %s",
  staticFilesVirtualPath ?? "/",
);
if (staticFilesVirtualPath) {
  app.use(staticFilesVirtualPath, express.static(staticFilesPath));
} else {
  app.use(express.static(staticFilesPath));
}

// POST endpoint for SPARQL queries.
app.post("/sparql", async (req, res, next) => {
  // Gather info from the headers
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const queryId = headers["queryid"];
  const graphDbConnectionUrl = headers["graph-db-connection-url"];
  const shouldLogDbQuery = BooleanStringSchema.default(false).parse(
    headers["db-query-logging-enabled"],
  );
  const isIamEnabled = !!headers["aws-neptune-region"];
  const region = isIamEnabled ? headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? (headers["service-type"] ?? DEFAULT_SERVICE_TYPE)
    : "";

  /// Function to cancel long running queries if the client disappears before completion
  async function cancelQuery() {
    if (!queryId) {
      return;
    }
    proxyLogger.debug(`Cancelling request ${queryId}...`);
    try {
      await retryFetch(
        new URL(`${graphDbConnectionUrl}/sparql/status`),
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
      proxyLogger.warn(err, "Failed to cancel the query");
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
    proxyLogger.debug("[SPARQL] Received database query:\n%s", queryString);
  }

  const rawUrl = `${graphDbConnectionUrl}/sparql`;
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
  // Gather info from the headers
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const queryId = headers["queryid"];
  const graphDbConnectionUrl = headers["graph-db-connection-url"];
  const shouldLogDbQuery = BooleanStringSchema.default(false).parse(
    headers["db-query-logging-enabled"],
  );
  const isIamEnabled = !!headers["aws-neptune-region"];
  const region = isIamEnabled ? headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? (headers["service-type"] ?? DEFAULT_SERVICE_TYPE)
    : "";

  // Validate the input before making any external calls.
  const queryString = req.body.query;
  if (!queryString) {
    res.status(400).send({ error: "[Proxy] Gremlin: query not provided" });
    return;
  }

  if (shouldLogDbQuery) {
    proxyLogger.debug("[Gremlin] Received database query:\n%s", queryString);
  }

  /// Function to cancel long running queries if the client disappears before completion
  async function cancelQuery() {
    if (!queryId) {
      return;
    }
    proxyLogger.debug(`Cancelling request ${queryId}...`);
    try {
      await retryFetch(
        new URL(
          `${graphDbConnectionUrl}/gremlin/status?cancelQuery&queryId=${encodeURIComponent(queryId)}`,
        ),
        { method: "GET" },
        isIamEnabled,
        region,
        serviceType,
      );
    } catch (err) {
      // Not really an error
      proxyLogger.warn(err, "Failed to cancel the query");
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
  const rawUrl = `${graphDbConnectionUrl}/gremlin`;
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
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const shouldLogDbQuery = BooleanStringSchema.default(false).parse(
    headers["db-query-logging-enabled"],
  );

  const queryString = req.body.query;
  // Validate the input before making any external calls.
  if (!queryString) {
    res.status(400).send({ error: "[Proxy]OpenCypher: query not provided" });
    return;
  }

  if (shouldLogDbQuery) {
    proxyLogger.debug("[openCypher] Received database query:\n%s", queryString);
  }

  const rawUrl = `${headers["graph-db-connection-url"]}/openCypher`;
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `query=${encodeURIComponent(queryString)}`,
  };

  const isIamEnabled = !!headers["aws-neptune-region"];
  const region = isIamEnabled ? headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? (headers["service-type"] ?? DEFAULT_SERVICE_TYPE)
    : "";

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

// GET endpoint to retrieve PropertyGraph statistics summary for Neptune Analytics.
app.get("/summary", async (req, res, next) => {
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const isIamEnabled = !!headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? (headers["service-type"] ?? DEFAULT_SERVICE_TYPE)
    : "";
  const rawUrl = `${headers["graph-db-connection-url"]}/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? headers["aws-neptune-region"] : "";

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

// GET endpoint to retrieve PropertyGraph statistics summary for Neptune DB.
app.get("/pg/statistics/summary", async (req, res, next) => {
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const isIamEnabled = !!headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? (headers["service-type"] ?? DEFAULT_SERVICE_TYPE)
    : "";
  const rawUrl = `${headers["graph-db-connection-url"]}/pg/statistics/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? headers["aws-neptune-region"] : "";

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

// GET endpoint to retrieve RDF statistics summary.
app.get("/rdf/statistics/summary", async (req, res, next) => {
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const isIamEnabled = !!headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? (headers["service-type"] ?? DEFAULT_SERVICE_TYPE)
    : "";
  const rawUrl = `${headers["graph-db-connection-url"]}/rdf/statistics/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? headers["aws-neptune-region"] : "";

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

app.get("/status", (_req, res) => {
  res.send("OK");
});

app.post("/logger", (req, res, next) => {
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
      proxyLogger.error(message);
    } else if (level.toLowerCase() === "warn") {
      proxyLogger.warn(message);
    } else if (level.toLowerCase() === "info") {
      proxyLogger.info(message);
    } else if (level.toLowerCase() === "debug") {
      proxyLogger.debug(message);
    } else if (level.toLowerCase() === "trace") {
      proxyLogger.trace(message);
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

// Relative paths to certificate files
const certificateKeyFilePath = path.join(
  proxyServerRoot,
  "cert-info/server.key",
);
const certificateFilePath = path.join(proxyServerRoot, "cert-info/server.crt");

// Get the port numbers to listen on
const host = env.HOST;
const httpPort = env.PROXY_SERVER_HTTP_PORT;
const httpsPort = env.PROXY_SERVER_HTTPS_PORT;
const useHttps =
  env.PROXY_SERVER_HTTPS_CONNECTION &&
  fs.existsSync(certificateKeyFilePath) &&
  fs.existsSync(certificateFilePath);

// Log the server locations based on the configuration.
function logServerLocations() {
  const scheme = useHttps ? "https" : "http";
  let port = "";

  // Only show the port if it is not one of the defaults
  if (useHttps && httpsPort !== 443) {
    port = `:${httpsPort}`;
  } else if (!useHttps && httpPort !== 80) {
    port = `:${httpPort}`;
  }

  const baseUrl = `${scheme}://${host}${port}`;
  proxyLogger.info(`Proxy server located at ${baseUrl}`);
  proxyLogger.info(
    `Graph Explorer UI located at: ${baseUrl}${staticFilesVirtualPath ?? ""}`,
  );
}

// Start the server on port 80 or 443 (if HTTPS is enabled)
function startServer() {
  if (useHttps) {
    const options = {
      key: fs.readFileSync(certificateKeyFilePath),
      cert: fs.readFileSync(certificateFilePath),
    };
    return https.createServer(options, app).listen(httpsPort, () => {
      logServerLocations();
    });
  } else {
    return app.listen(httpPort, () => {
      logServerLocations();
    });
  }
}

const server = startServer();

process.on("uncaughtException", (error: Error) => {
  handleError(error);
});

process.on("unhandledRejection", reason => {
  handleError(reason);
});

// Watch for shutdown event and close gracefully.
process.on("SIGTERM", () => {
  proxyLogger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    proxyLogger.info("HTTP server closed");
  });
});
