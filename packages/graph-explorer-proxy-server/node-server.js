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
  response.status(error.status || 500).send({
    error: {
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
        const result = await res.json();
        proxyLogger.error("!!Request failure!!");
        proxyLogger.error("URL: " + url.href);
        throw new Error("\n" + JSON.stringify(result, null, 2));
      } else {
        proxyLogger.debug("Successful response: " + res.statusText);
        return res;
      }
    } catch (err) {
      if (i === refetchMaxRetries - 1) {
        proxyLogger.error("!!Proxy Retry Fetch Reached Maximum Tries!!", err);
        throw err;
      } else {
        proxyLogger.debug("Proxy Retry Fetch Count::: " + i);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
};

// Function to fetch data from the given URL and send it as a response.
async function fetchData(res, next, url, options, isIamEnabled, region, serviceType) {
  try {
    const response = await retryFetch(
      new URL(url),
      options,
      isIamEnabled,
      region,
      serviceType
    );
    const data = await response.json();
    if (url.includes("status")) {
      console.log(url, data); // !!!
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

(async () => {
  app.use(errorHandler);
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
  if (process.env.NEPTUNE_NOTEBOOK !== "false") {
    app.use(
      "/explorer",
      express.static(path.join(__dirname, "../graph-explorer/dist"))
    );
  } else {
    app.use(
      process.env.GRAPH_EXP_ENV_ROOT_FOLDER,
      express.static(path.join(__dirname, "../graph-explorer/dist"))
    );
  }
  // POST endpoint for SPARQL queries.
  app.post("/sparql", async (req, res, next) => {
    // Validate the input before making any external calls.
    if (!req.body.query) {
      return res
        .status(400)
        .send({ error: "[Proxy]SPARQL: Query not provided" });
    }
    const rawUrl = `${req.headers["graph-db-connection-url"]}/sparql`;
    let body = `query=${encodeURIComponent(req.body.query)}`
    if (req.headers["queryid"]) {
      body += `&queryId=${req.headers["queryid"]}`;
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    };
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // cancel sparql query
  app.get("/sparql/cancel", async (req, res, next) => {
    console.log('/sparql/cancel', req.headers["queryid"]); // !!!
    const rawUrl = `${req.headers["graph-db-connection-url"]}/sparql/status`;
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `cancelQuery&queryId=${req.headers["queryid"]}&silent=true`,
    };

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // POST endpoint for Gremlin queries.
  app.post("/gremlin", async (req, res, next) => {
    // Validate the input before making any external calls.
    if (!req.body.query) {
      return res
        .status(400)
        .send({ error: "[Proxy]Gremlin: query not provided" });
    }
    const body = req.headers["queryid"]
      ? { gremlin: req.body.query, queryId: req.headers["queryid"] }
      : { gremlin: req.body.query };
    const rawUrl = `${req.headers["graph-db-connection-url"]}/gremlin`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };

    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // cancel gremlin query
  app.get("/gremlin/cancel", async (req, res, next) => {
    console.log('/gremlin/cancel', req.headers["queryid"]); // !!!

    const rawUrl = `${req.headers["graph-db-connection-url"]}/gremlin/status?cancelQuery&queryId=${req.headers["queryid"]}&silent=true`;
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";

    const requestOptions = {
      method: "GET",
    };

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // POST endpoint for openCypher queries.
  app.post("/openCypher", async (req, res, next) => {
    // Validate the input before making any external calls.
    if (!req.body.query) {
      return res
        .status(400)
        .send({ error: "[Proxy]OpenCypher: query not provided" });
    }
    console.log("/openCypher" ,req.headers["queryid"]);
    let rawUrl = `${req.headers["graph-db-connection-url"]}/openCypher`;
    if (req.headers["queryid"]) {
      rawUrl += `?queryId=${req.headers["queryid"]}`;
    }
    const body = req.headers["queryid"]
      ? `query=${encodeURIComponent(req.body.query)}&queryId=${req.headers["queryid"]}`
      : `query=${encodeURIComponent(req.body.query)}`;

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    };

    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // cancel openCypher query
  app.get("/openCypher/cancel", async (req, res, next) => {
    console.log('/openCypher/cancel', req.headers["queryid"]); // !!!
    
    const rawUrl = `${req.headers["graph-db-connection-url"]}/openCypher/status?cancelQuery&queryId=${req.headers["queryid"]}&silent=true`;
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";

    const requestOptions = {
      method: "GET",
    };

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // GET endpoint to retrieve PropertyGraph statistics summary for Neptune Analytics.
  app.get("/summary", async (req, res, next) => {
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";
    const rawUrl = `${req.headers["graph-db-connection-url"]}/summary?mode=detailed`;

    const requestOptions = {
      method: "GET",
    };

    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // GET endpoint to retrieve PropertyGraph statistics summary for Neptune DB.
  app.get("/pg/statistics/summary", async (req, res, next) => {
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";
    const rawUrl = `${req.headers["graph-db-connection-url"]}/pg/statistics/summary?mode=detailed`;

    const requestOptions = {
      method: "GET",
    };

    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
  });

  // GET endpoint to retrieve RDF statistics summary.
  app.get("/rdf/statistics/summary", async (req, res, next) => {
    const isIamEnabled = !!req.headers["aws-neptune-region"];
    const serviceType = isIamEnabled ? (req.headers["service-type"] ?? DEFAULT_SERVICE_TYPE) : "";
    const rawUrl = `${req.headers["graph-db-connection-url"]}/rdf/statistics/summary?mode=detailed`;

    const requestOptions = {
      method: "GET",
    };

    const region = isIamEnabled ? req.headers["aws-neptune-region"] : "";

    fetchData(res, next, rawUrl, requestOptions, isIamEnabled, region, serviceType);
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
  app.use(errorHandler);
  // Start the server on port 80 or 443 (if HTTPS is enabled)
  if (process.env.NEPTUNE_NOTEBOOK === "true") {
    app.listen(9250, async () => {
      proxyLogger.info(
        `\tProxy available at port 9250 for Neptune Notebook instance`
      );
    });
  } else if (
    process.env.PROXY_SERVER_HTTPS_CONNECTION !== "false" &&
    fs.existsSync("../graph-explorer-proxy-server/cert-info/server.key") &&
    fs.existsSync("../graph-explorer-proxy-server/cert-info/server.crt")
  ) {
    https
      .createServer(
        {
          key: fs.readFileSync("./cert-info/server.key"),
          cert: fs.readFileSync("./cert-info/server.crt"),
        },
        app
      )
      .listen(443, async () => {
        proxyLogger.info(`Proxy server located at https://localhost`);
        proxyLogger.info(
          `Graph Explorer live at: ${process.env.GRAPH_CONNECTION_URL}/explorer`
        );
      });
  } else {
    app.listen(80, async () => {
      proxyLogger.info(`Proxy server located at http://localhost`);
    });
  }
})();
