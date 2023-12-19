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

// Middleware to sign requests with AWS4 signing process if IAM is enabled.
async function aws4SigningMiddleware(req, res, next) {
  if (req.headers["aws-neptune-region"]) {
    const options = {
      host: req.hostname,
      port: req.port,
      path: req.path + req.search,
      service: "neptune-db",
      region: req.headers["aws-neptune-region"],
    };

    try {
      const credentials = await getIAMHeaders(options);
      const signedHeaders = aws4.sign(options, credentials).headers;
      req.headers = { ...req.headers, ...signedHeaders };
      delete req.headers["Host"];
      delete req.headers["host"];
      next();
    } catch (error) {
      proxyLogger.error("!getIAMHeaders failure!" + error);

      next(error);
    }
  } else {
    next();
  }
}

// Function to get IAM headers for AWS4 signing process.
async function getIAMHeaders(options) {
  proxyLogger.debug("IAM on");
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
  }).headers;
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
  headers,
  retryDelay = 10000,
  refetchMaxRetries = 1
) => {
  for (let i = 0; i < refetchMaxRetries; i++) {
    delete headers.headers["host"];
    delete headers.headers["Host"];
    try {
      const res = await fetch(url.href, headers);
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
        proxyLogger.error("!!Proxy Retry Fetch Reached Maximum Tries!!");
        throw err;
      } else {
        proxyLogger.debug("Proxy Retry Fetch Count::: " + i);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
};

// Function to fetch data from the given URL and send it as a response.
async function fetchData(url, options, res, next) {
  try {
    const response = await retryFetch(new URL(url), options);
    const data = await response.json();
    res.send(data);
  } catch (error) {
    next(error);
  }
}

(async () => {
  app.use(compression()); // Use compression middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(aws4SigningMiddleware);
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
      return res.status(400).send({ error: "Query not provided" });
    }
    const rawUrl = `${req.headers["graph-db-connection-url"]}/sparql`;
    const requestOptions = {
      method: "POST",
      headers: req.headers,
      // Properly encode the query to ensure it's safe for URL transport.
      body: `query=${encodeURIComponent(req.body.query)}`,
    };

    fetchData(rawUrl, requestOptions, res, next);
  });

  // POST endpoint for Gremlin queries.
  app.post("/gremlin", async (req, res, next) => {
    // Validate the input before making any external calls.
    if (!req.body.gremlin) {
      return res.status(400).send({ error: "Gremlin query not provided" });
    }
    const body = { gremlin: req.body.gremlin };
    const rawUrl = `${req.headers["graph-db-connection-url"]}/gremlin`;
    const requestOptions = {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(body),
    };

    fetchData(rawUrl, requestOptions, res, next);
  });

  // POST endpoint for openCypher queries.
  app.post("/openCypher", async (req, res, next) => {
    // Validate the input before making any external calls.
    if (!req.body.query) {
      return res.status(400).send({ error: "openCypher query not provided" });
    }
    const body = { query: req.body.query };
    const rawUrl = `${req.headers["graph-db-connection-url"]}/openCypher`;

    const requestOptions = {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(body),
    };

    fetchData(rawUrl, requestOptions, res, next);
  });

  // GET endpoint to retrieve PostgreSQL statistics summary.
  app.get("/pg/statistics/summary", async (req, res, next) => {
    const rawUrl = `${req.headers["graph-db-connection-url"]}/pg/statistics/summary?mode=detailed`;

    const requestOptions = {
      method: "GET",
      headers: req.headers,
    };
    fetchData(rawUrl, requestOptions, res, next);
  });

  // GET endpoint to retrieve RDF statistics summary.
  app.get("/rdf/statistics/summary", async (req, res, next) => {
    const rawUrl = `${req.headers["graph-db-connection-url"]}/rdf/statistics/summary?mode=detailed`;

    const requestOptions = {
      method: "GET",
      headers: req.headers,
    };
    fetchData(rawUrl, requestOptions, res, next);
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
