import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import fetch from "node-fetch";
import https from "https";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import aws4 from "aws4";
import { IncomingHttpHeaders } from "http";
import { createLogger, requestLoggingMiddleware } from "./logging.js";

// Construct relative paths
const clientRoot = path.join(import.meta.dirname, "../../graph-explorer/");
const proxyServerRoot = path.join(import.meta.dirname, "../");

const app = express();

// Load environment variables from .env file.
dotenv.config({
  path: [path.join(clientRoot, ".env.local"), path.join(clientRoot, ".env")],
});

const DEFAULT_SERVICE_TYPE = "neptune-db";
const NEPTUNE_ANALYTICS_SERVICE_TYPE = "neptune-graph";

interface DbQueryIncomingHttpHeaders extends IncomingHttpHeaders {
  queryid?: string;
  "graph-db-connection-url"?: string;
  "aws-neptune-region"?: string;
  "service-type"?: string;
}

interface LoggerIncomingHttpHeaders extends IncomingHttpHeaders {
  level?: string;
  message?: string;
}

const proxyLogger = createLogger();
app.use(requestLoggingMiddleware(proxyLogger));

// Function to get IAM headers for AWS4 signing process.
async function getIAMHeaders(options) {
  const credentialProvider = fromNodeProviderChain();
  let creds = await credentialProvider();
  if (creds === undefined) {
    throw new Error(
      "IAM is enabled but credentials cannot be found on the credential provider chain."
    );
  }
  const headers = aws4.sign(options, {
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    sessionToken: creds.sessionToken,
  });

  return headers;
}

// Error handler middleware to log errors and send appropriate response.
const errorHandler = (error, request, response, next) => {
  if (error.extraInfo) {
    proxyLogger.error(error.extraInfo + error.message);
    proxyLogger.debug(error.stack);
  } else {
    proxyLogger.error(error.message);
    proxyLogger.debug(error.stack);
  }

  response.status(error.status || 500).json({
    error: {
      ...error,
      status: error.status || 500,
      message: error.message || "Internal Server Error",
    },
  });
};

// Function to retry fetch requests with exponential backoff.
const retryFetch = async (
  url,
  options,
  isIamEnabled,
  region,
  serviceType,
  retryDelay = 10000,
  refetchMaxRetries = 1
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
    };

    try {
      const res = await fetch(url.href, options);
      if (!res.ok) {
        proxyLogger.error("!!Request failure!!");
        proxyLogger.error("URL: " + url.href);
        proxyLogger.error(`Response: ${res.status} - ${res.statusText}`);
        return res;
      } else {
        proxyLogger.debug("Successful response: " + res.statusText);
        return res;
      }
    } catch (err) {
      if (refetchMaxRetries === 1) {
        // Don't log about retries if retrying is not used
        throw err;
      } else if (i === refetchMaxRetries - 1) {
        proxyLogger.error("!!Proxy Retry Fetch Reached Maximum Tries!!", err);
        throw err;
      } else {
        proxyLogger.debug("Proxy Retry Fetch Count::: " + i);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
};

// Function to fetch data from the given URL and send it as a response.
async function fetchData(
  res,
  next,
  url,
  options,
  isIamEnabled,
  region,
  serviceType
) {
  try {
    const response = await retryFetch(
      new URL(url),
      options,
      isIamEnabled,
      region,
      serviceType
    );
    const data = await response!.json();
    res.status(response!.status);
    res.send(data);
  } catch (error) {
    next(error);
  }
}

app.use(compression()); // Use compression middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  "/defaultConnection",
  express.static(path.join(clientRoot, "defaultConnection.json"))
);

// Host the Graph Explorer UI static files
const staticFilesVirtualPath = process.env.GRAPH_EXP_ENV_ROOT_FOLDER;
const staticFilesPath = path.join(clientRoot, "dist");

proxyLogger.info("Hosting client side static files from: %s", staticFilesPath);
proxyLogger.info(
  "Hosting client side static files at: %s",
  staticFilesVirtualPath ?? "/"
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
  const isIamEnabled = !!headers["aws-neptune-region"];
  const region = isIamEnabled ? headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? headers["service-type"] ?? DEFAULT_SERVICE_TYPE
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
        serviceType
      );
    } catch (err) {
      // Not really an error
      proxyLogger.warn("Failed to cancel the query: " + err);
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
  if (!req.body.query) {
    return res.status(400).send({ error: "[Proxy]SPARQL: Query not provided" });
  }
  const rawUrl = `${graphDbConnectionUrl}/sparql`;
  let body = `query=${encodeURIComponent(req.body.query)}`;
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

  fetchData(
    res,
    next,
    rawUrl,
    requestOptions,
    isIamEnabled,
    region,
    serviceType
  );
});

// POST endpoint for Gremlin queries.
app.post("/gremlin", async (req, res, next) => {
  // Gather info from the headers
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const queryId = headers["queryid"];
  const graphDbConnectionUrl = headers["graph-db-connection-url"];
  const isIamEnabled = !!headers["aws-neptune-region"];
  const region = isIamEnabled ? headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";

  // Validate the input before making any external calls.
  if (!req.body.query) {
    return res
      .status(400)
      .send({ error: "[Proxy]Gremlin: query not provided" });
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
          `${graphDbConnectionUrl}/gremlin/status?cancelQuery&queryId=${encodeURIComponent(queryId)}`
        ),
        { method: "GET" },
        isIamEnabled,
        region,
        serviceType
      );
    } catch (err) {
      // Not really an error
      proxyLogger.warn("Failed to cancel the query: " + err);
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

  const body = { gremlin: req.body.query, queryId };
  const rawUrl = `${graphDbConnectionUrl}/gremlin`;
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.gremlin-v3.0+json",
    },
    body: JSON.stringify(body),
  };

  fetchData(
    res,
    next,
    rawUrl,
    requestOptions,
    isIamEnabled,
    region,
    serviceType
  );
});

// POST endpoint for openCypher queries.
app.post("/openCypher", async (req, res, next) => {
  // Validate the input before making any external calls.
  if (!req.body.query) {
    return res
      .status(400)
      .send({ error: "[Proxy]OpenCypher: query not provided" });
  }

  const rawUrl = `${req.headers["graph-db-connection-url"]}/openCypher`;
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: `query=${encodeURIComponent(req.body.query)}`,
  };

  const isIamEnabled = !!req.headers["aws-neptune-region"];
  const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";

  fetchData(
    res,
    next,
    rawUrl,
    requestOptions,
    isIamEnabled,
    region,
    serviceType
  );
});

// GET endpoint to retrieve PropertyGraph statistics summary for Neptune Analytics.
app.get("/summary", async (req, res, next) => {
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const isIamEnabled = !!headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";
  const rawUrl = `${headers["graph-db-connection-url"]}/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? headers["aws-neptune-region"] : "";

  fetchData(
    res,
    next,
    rawUrl,
    requestOptions,
    isIamEnabled,
    region,
    serviceType
  );
});

// GET endpoint to retrieve PropertyGraph statistics summary for Neptune DB.
app.get("/pg/statistics/summary", async (req, res, next) => {
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const isIamEnabled = !!headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";
  const rawUrl = `${headers["graph-db-connection-url"]}/pg/statistics/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? headers["aws-neptune-region"] : "";

  fetchData(
    res,
    next,
    rawUrl,
    requestOptions,
    isIamEnabled,
    region,
    serviceType
  );
});

// GET endpoint to retrieve RDF statistics summary.
app.get("/rdf/statistics/summary", async (req, res, next) => {
  const headers = req.headers as DbQueryIncomingHttpHeaders;
  const isIamEnabled = !!headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";
  const rawUrl = `${headers["graph-db-connection-url"]}/rdf/statistics/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? headers["aws-neptune-region"] : "";

  fetchData(
    res,
    next,
    rawUrl,
    requestOptions,
    isIamEnabled,
    region,
    serviceType
  );
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
      message = headers["message"].replaceAll("\\", "");
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

// Plugin the error handler after the routes
app.use(errorHandler);

// Relative paths to certificate files
const certificateKeyFilePath = path.join(
  proxyServerRoot,
  "cert-info/server.key"
);
const certificateFilePath = path.join(proxyServerRoot, "cert-info/server.crt");

// Get the port numbers to listen on
const host = process.env.HOST || "localhost";
const httpPort = process.env.PROXY_SERVER_HTTP_PORT || 80;
const httpsPort = process.env.PROXY_SERVER_HTTPS_PORT || 443;
const useHttps =
  process.env.PROXY_SERVER_HTTPS_CONNECTION === "true" &&
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
    `Graph Explorer UI located at: ${baseUrl}${staticFilesVirtualPath ?? ""}`
  );
}

// Start the server on port 80 or 443 (if HTTPS is enabled)
if (useHttps) {
  const options = {
    key: fs.readFileSync(certificateKeyFilePath),
    cert: fs.readFileSync(certificateFilePath),
  };
  https.createServer(options, app).listen(httpsPort, () => {
    logServerLocations();
  });
} else {
  app.listen(httpPort, () => {
    logServerLocations();
  });
}
