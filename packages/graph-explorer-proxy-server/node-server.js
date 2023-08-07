const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const { RequestSig } = require("./RequestSig.js");
const https = require("https");
const fs = require("fs");
const path = require("path");
const pino = require('pino');
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const aws4 = require("aws4");

dotenv.config({ path: "../graph-explorer/.env" });

const proxyLogger = pino({
  level: process.env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
    }
  }
});

async function getIAMHeaders(options) {
  proxyLogger.debug("IAM on")
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
    error.extraInfo += " Error: ";
    proxyLogger.error(error.extraInfo + error.message);
    proxyLogger.debug(error.stack);
  } else {
    proxyLogger.error("Error: " + error.message);
    proxyLogger.debug(error.stack);
  }

  response.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || 'Internal Server Error',
    },
  });
}

(async () => {
  app.use(cors());

  app.use(
    process.env.GRAPH_EXP_ENV_ROOT_FOLDER,
    express.static(path.join(__dirname, "../graph-explorer/dist"))
  );

  const delay = (ms) =>
    new Promise((resolve) => setTimeout(() => resolve(), ms));

  const retryFetch = async (url, headers, retries = 1, retryDelay = 10000) => {
    if (headers["aws-neptune-region"]) {
      data = await getIAMHeaders({
        host: url.hostname,
        port: url.port,
        path: url.pathname+url.search,
        service: "neptune-db",
        region: headers["aws-neptune-region"]
      });
      // remove the host header because it's not needed for IAM
      delete headers["host"];
      headers = { ...headers, ...data };
    } 
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url.href, { headers: headers });
        if (!res.ok) {
          const result = await res.json();
          console.log("Bad response: ", res.statusText);
          console.log("Error message: ", result);
          throw new Error(result.message);
        } else {
          console.log("Successful response: "+res.statusText);
          return res;
        }
      } catch (err) {
        if (i === retries - 1) {
          throw err;
        } else {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  };

<<<<<<< HEAD
  async function getRequestObjects(endpoint_input, region_input) {
    if (endpoint_input) {
      endpoint_url = new URL(endpoint_input);
      requestSig = await new RequestSig(
        endpoint_url.host,
        region_input,
        creds.accessKeyId,
        creds.secretAccessKey,
        creds.sessionToken
      );
      endpoint = endpoint_input;
    } else {
      console.log("No endpoint passed");
    }

    return [new URL(endpoint_input), endpoint_input, requestSig];
  }

  async function getAuthHeaders(language, req, endpoint_url, requestSig) {
    let authHeaders
    if (language == "sparql") {
      authHeaders = await requestSig.requestAuthHeaders(
        endpoint_url.port,
        "/sparql?query=" + encodeURIComponent(req.query.query) + "&format=json"
      );
    } else if (language == "gremlin") {
      authHeaders = await requestSig.requestAuthHeaders(
        endpoint_url.port,
        "/?gremlin=" + encodeURIComponent(req.query.gremlin)
      );
    } else if (language == "openCypher") {
      authHeaders = await requestSig.requestAuthHeaders(
        endpoint_url.port,
        "/openCypher?query=" + encodeURIComponent(req.query.query)
      );
    } else {
      console.log(language + " is not supported.");
    }

    req.headers["Authorization"] = authHeaders["headers"]["Authorization"];
    req.headers["X-Amz-Date"] = authHeaders["headers"]["X-Amz-Date"];
    if (authHeaders["headers"]["X-Amz-Security-Token"]) {
      req.headers["X-Amz-Security-Token"] = authHeaders["headers"]["X-Amz-Security-Token"];
    }
    req.headers["host"] = endpoint_url.host;
  }

=======
>>>>>>> main
  app.get("/sparql", async (req, res, next) => {
    try {
      const response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/sparql?query=` +
            encodeURIComponent(req.query.query) +
            "&format=json"
        ),
        req.headers
      );
      const data = await response.json();
      res.send(data);
    } catch (error) {
      if (!error.extraInfo && req.headers["graph-db-connection-url"] !== undefined) {
        error.extraInfo = "The following request returned an error " + 
                        `${req.headers["graph-db-connection-url"]}/sparql?query=` +
                        encodeURIComponent(req.query.query) + ".";
      } 

      next(error);
    }
  });

  app.get("/", async (req, res, next) => {
    try {
      const response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/?gremlin=` +
            encodeURIComponent(req.query.gremlin)
        ),
        req.headers
      );
      const data = await response.json();
      res.send(data);
    } catch (error) {
      if (!error.extraInfo && req.headers["graph-db-connection-url"] !== undefined) {
        error.extraInfo = "The following request returned an error " + 
                        `${req.headers["graph-db-connection-url"]}/?gremlin=` +
                        encodeURIComponent(req.query.gremlin) + ".";
      }

      next(error);
    }
  });

  app.get("/openCypher", async (req, res, next) => {
    let response;
    let data;
    try {
      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/openCypher?query=` +
        encodeURIComponent(req.query.query), undefined, undefined, req, "openCypher").then((res) => res)

      data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.log(error);
    }
  });

  app.get("/pg/statistics/summary", async (req, res, next) => {
    try {
      const response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/pg/statistics/summary`
        ),
        req.headers
      );
      const data = await response.json();
      res.send(data);
    } catch (error) {
      if (!error.extraInfo && req.headers["graph-db-connection-url"] !== undefined) {
        error.extraInfo = "Check that your instance type supports the summary statistics.";
      }

      next(error);
    }
  });

  app.get("/rdf/statistics/summary", async (req, res, next) => {
    try {
      const response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/rdf/statistics/summary`
          ), 
          req.headers
      );
      const data = await response.json();
      res.send(data);
    } catch (error) {
      if (!error.extraInfo && req.headers["graph-db-connection-url"] !== undefined) {
        error.extraInfo = "Check that your instance type supports the summary statistics.";
      }
      next(error);
    }
  });

  app.get('/logger', (req, res) => {
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
  if (
    process.env.PROXY_SERVER_HTTPS_CONNECTION != "false" &&
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
      });
  } else {
    app.listen(80, async () => {
      proxyLogger.info(`Proxy server located at http://localhost`);
    });
  }
})();