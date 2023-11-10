const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const https = require("https");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const aws4 = require("aws4");
dotenv.config({ path: "../graph-explorer/.env" });
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
(async () => {
  app.use(cors());
  // To allow the proxy to parse the body of the request as JSON
  app.use(express.json());
  // To allow the proxy to parse the body of the request as URL encoded data
  app.use(express.urlencoded({ extended: true }));
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
  const retryFetch = async (
    url,
    headers,
    retryDelay = 10000,
    refetchMaxRetries = 1
  ) => {
    delete headers["host"];

    if (headers["aws-neptune-region"]) {
      const data = await getIAMHeaders({
        host: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        service: "neptune-db",
        region: headers["aws-neptune-region"],
      });
      headers = { ...headers, ...data };
    }

    for (let i = 0; i < refetchMaxRetries; i++) {
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

  // POST endpoint for SPARQL queries.
  app.post("/sparql", async (req, res, next) => {
    // Logging the body for debugging purposes. This should be removed in production.(Uncomment below to info logging)
    // proxyLogger.info(":/sparql req.body:", req.body);

    // Validate the input before making any external calls.
    if (!req.body.query) {
      return res.status(400).send({ error: "Query not provided" });
    }

    try {
      // Execute a retryable fetch operation to the SPARQL endpoint.
      const response = await retryFetch(
        new URL(`${req.headers["graph-db-connection-url"]}/sparql`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          // Properly encode the query to ensure it's safe for URL transport.
          body: `query=${encodeURIComponent(req.body.query)}`,
        }
      );

      // Parse the JSON response and forward it to the client.
      const data = await response.json();
      res.send(data);
    } catch (error) {
      // Pass any errors to the error-handling middleware.
      next(error);
    }
  });

  // POST endpoint for Gremlin queries.
  app.post("/gremlin", async (req, res, next) => {
    // Logging the body for debugging purposes. This should be removed in production.(Uncomment below to info logging)
    // proxyLogger.info(":/gremlin req.body:", req.body);

    // Validate the input before making any external calls.
    if (!req.body.gremlin) {
      return res.status(400).send({ error: "Gremlin query not provided" });
    }

    try {
      // Package the query into a JSON body.
      const body = { gremlin: req.body.gremlin };

      // Execute a retryable fetch operation to the Gremlin endpoint.
      const response = await retryFetch(
        new URL(`${req.headers["graph-db-connection-url"]}/gremlin`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      // Parse the JSON response and forward it to the client.
      const data = await response.json();
      res.send(data);
    } catch (error) {
      // Pass any errors to the error-handling middleware.
      next(error);
    }
  });

  // POST endpoint for openCypher queries.
  app.post("/openCypher", async (req, res, next) => {
    // Logging the body for debugging purposes. This should be removed in production.(Uncomment below to info logging)
    // proxyLogger.info(":/openCypher req.body:", req.body);

    // Validate the input before making any external calls.
    if (!req.body.query) {
      return res.status(400).send({ error: "openCypher query not provided" });
    }

    try {
      // Package the query into a JSON body.
      const body = { query: req.body.query };

      // Execute a retryable fetch operation to the openCypher endpoint.
      const response = await retryFetch(
        new URL(`${req.headers["graph-db-connection-url"]}/openCypher`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      // Parse the JSON response and forward it to the client.
      const data = await response.json();
      res.send(data);
    } catch (error) {
      // Pass any errors to the error-handling middleware.
      next(error);
    }
  });

  // GET endpoint to retrieve PostgreSQL statistics summary.
  app.get("/pg/statistics/summary", async (req, res, next) => {
    try {
      // Execute a fetch operation to retrieve the PostgreSQL statistics summary.
      const response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/pg/statistics/summary`
        ),
        req.headers
      );

      // Parse the JSON response and forward it to the client.
      const data = await response.json();
      res.send(data);
    } catch (err) {
      // Pass any errors to the error-handling middleware.
      next(err);
    }
  });

  // GET endpoint to retrieve RDF statistics summary.
  app.get("/rdf/statistics/summary", async (req, res, next) => {
    try {
      // Execute a fetch operation to retrieve the RDF statistics summary.
      const response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/rdf/statistics/summary`
        ),
        req.headers
      );

      // Parse the JSON response and forward it to the client.
      const data = await response.json();
      res.send(data);
    } catch (err) {
      // Pass any errors to the error-handling middleware.
      next(err);
    }
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
