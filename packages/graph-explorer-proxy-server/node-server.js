const express = require("express");
const cors = require("cors");
const compression = require("compression");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const https = require("https");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const aws4 = require("aws4");

// Load environment variables from .env file.
dotenv.config({ path: "../graph-explorer/.env" });

const DEFAULT_SERVICE_TYPE = "neptune-db";
const NEPTUNE_ANALYTICS_SERVICE_TYPE = "neptune-graph";

// Create a logger instance with pino.
const proxyLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: true,
    },
  },
});

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
      data = await getIAMHeaders({
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
    const data = await response.json();
    res.status(response.status);
    res.send(data);
  } catch (error) {
    next(error);
  }
}

app.use(compression()); // Use compression middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  "/defaultConnection",
  express.static(
    path.join(__dirname, "../graph-explorer/defaultConnection.json")
  )
);

// Host the Graph Explorer UI static files
let staticFilesBasePath =
  process.env.NEPTUNE_NOTEBOOK !== "false"
    ? "/explorer"
    : process.env.GRAPH_EXP_ENV_ROOT_FOLDER;

app.use(
  staticFilesBasePath,
  express.static(path.join(__dirname, "../graph-explorer/dist"))
);

// POST endpoint for SPARQL queries.
app.post("/sparql", async (req, res, next) => {
  // Gather info from the headers
  const queryId = req.headers["queryid"];
  const graphDbConnectionUrl = req.headers["graph-db-connection-url"];
  const isIamEnabled = !!req.headers["aws-neptune-region"];
  const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE
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
      Accept: "application/json",
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
  const queryId = req.headers["queryid"];
  const graphDbConnectionUrl = req.headers["graph-db-connection-url"];
  const isIamEnabled = !!req.headers["aws-neptune-region"];
  const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
  const serviceType = isIamEnabled
    ? req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE
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
  const isIamEnabled = !!req.headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";
  const rawUrl = `${req.headers["graph-db-connection-url"]}/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";

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
  const isIamEnabled = !!req.headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";
  const rawUrl = `${req.headers["graph-db-connection-url"]}/pg/statistics/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";

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
  const isIamEnabled = !!req.headers["aws-neptune-region"];
  const serviceType = isIamEnabled
    ? req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE
    : "";
  const rawUrl = `${req.headers["graph-db-connection-url"]}/rdf/statistics/summary?mode=detailed`;

  const requestOptions = {
    method: "GET",
  };

  const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";

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

app.get("/logger", (req, res, next) => {
  let message;
  let level;
  try {
    if (req.headers["level"] === undefined) {
      throw new Error("No log level passed.");
    } else {
      level = req.headers["level"];
    }
    if (req.headers["message"] === undefined) {
      throw new Error("No log message passed.");
    } else {
      message = req.headers["message"].replaceAll("\\", "");
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

// Start the server on port 80 or 443 (if HTTPS is enabled)
if (process.env.NEPTUNE_NOTEBOOK === "true") {
  app.listen(9250, () => {
    proxyLogger.info(
      `\tProxy available at port 9250 for Neptune Notebook instance`
    );
  });
} else if (
  process.env.PROXY_SERVER_HTTPS_CONNECTION !== "false" &&
  fs.existsSync("../graph-explorer-proxy-server/cert-info/server.key") &&
  fs.existsSync("../graph-explorer-proxy-server/cert-info/server.crt")
) {
  const options = {
    key: fs.readFileSync("./cert-info/server.key"),
    cert: fs.readFileSync("./cert-info/server.crt"),
  };
  https.createServer(options, app).listen(443, () => {
    proxyLogger.info(`Proxy server located at https://localhost`);
    proxyLogger.info(
      `Graph Explorer UI located at: https://localhost${staticFilesBasePath}`
    );
  });
} else {
  app.listen(80, () => {
    proxyLogger.info(`Proxy server located at http://localhost`);
    proxyLogger.info(
      `Graph Explorer UI located at: http://localhost${staticFilesBasePath}`
    );
  });
}
