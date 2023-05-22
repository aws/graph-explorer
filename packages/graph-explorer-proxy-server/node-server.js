const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const AWS = require("aws-sdk");
const { RequestSig } = require("./RequestSig.js");
const https = require("https");
const fs = require("fs");
const path = require("path");
const pino = require('pino');

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

const getCredentials = async () => {
  let credentials;
  let credProvider = new AWS.CredentialProviderChain();
  try {
    credentials = await new Promise((resolve, reject) => {
      credProvider.resolve(function (err, creds) {
        if (err) {
          reject(err);
          return;
        }
        proxyLogger.info("Master credentials available and loaded in.");
        resolve(creds);
      });
    });
  } catch (e) {
    proxyLogger.info("No master credentials found.");
  }

  return credentials;
};

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
  let creds = await getCredentials();
  let requestSig;

  app.use(cors());
  app.use("/explorer", express.static(path.join(__dirname, "../graph-explorer/dist")));

  const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

  async function retryFetch (
    url,
    retries = 1,
    retryDelay = 10000,
    req,
    language
  ) {

    let reqObjects;

    if (creds === undefined) {
      proxyLogger.info("Credentials undefined. Trying to find some.");
      creds = await getCredentials();
      if (creds === undefined) {
        throw new Error("Credentials still undefined after attempted refresh. Check that the environment has an appropriate IAM role that trusts it and that it has sufficient read permissions to connect to Neptune.");
      }
    }

    reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
    await getAuthHeaders(language, req, reqObjects[0], reqObjects[2]);

    return new Promise((resolve, reject) => {

      const wrapper = (n) => {
        fetch(url, { headers: req.headers, })
          .then(async res => {

            if (!res.ok) {
              throw new Error("The response was not successful and had a " + res.status + "code with a message of \"" + res.statusText + "\".");
            } else {
              resolve(res);
            }
          })
          .catch(async (error) => {
            if (n > 0) {
              proxyLogger.info("Received an error. Attempting a credential refresh.")
              creds = await getCredentials();
              if (creds === undefined) {
                error.extraInfo = "Credentials undefined after credential refresh. Check that you have proper acccess.";
                throw error;
              }
            }
            reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
            await getAuthHeaders(language, req, reqObjects[0], reqObjects[2]);

            if (n > 0) {
              await delay(retryDelay);
              wrapper(--n);
            } else {
              error.extraInfo = "Still receiving error after credential refresh.";
              reject(error);
            }
          });
      };

      wrapper(retries);
    });
  };

  async function getRequestObjects(endpoint_input, region_input) {
      try {
        endpoint_url = new URL(endpoint_input);
        requestSig = await new RequestSig(
          endpoint_url.host,
          region_input,
          creds.accessKeyId,
          creds.secretAccessKey,
          creds.sessionToken
        );
        endpoint = endpoint_input;

        return [endpoint_url, endpoint_input, requestSig];
      } catch (error) {
        if (error instanceof TypeError && error.message === "Invalid URL") {
          error.extraInfo = "Attempted to create the authentication headers necessary for AWS SigV4. Check that the \"Graph Connection URL\" field in your configuration is a properly formatted URL.";
        }
        throw error;
      }
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
    } else {
      proxyLogger.info(language + "is not supported.");
    }

    req.headers["Authorization"] = authHeaders["headers"]["Authorization"];
    req.headers["X-Amz-Date"] = authHeaders["headers"]["X-Amz-Date"];
    if (authHeaders["headers"]["X-Amz-Security-Token"]) {
      req.headers["X-Amz-Security-Token"] = authHeaders["headers"]["X-Amz-Security-Token"];
    }
    req.headers["host"] = endpoint_url.host;
  }

  app.get("/sparql", async (req, res, next) => {
    let response;
    let data;
    try {
      if (req.headers["graph-db-connection-url"] === undefined) {
        throw new Error("No header received for graph-db-connection-url. Query attempted: " + req.query.query);
      }

      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/sparql?query=` +
        encodeURIComponent(req.query.query) +
        "&format=json", undefined, undefined, req, "sparql").then((res) => res)

      data = await response.json();
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
    let response;
    let data;
    try {
      if (req.headers["graph-db-connection-url"] === undefined) {
        throw new Error("No header received for graph-db-connection-url. Query attempted: " + req.query.gremlin);
      } 

      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/?gremlin=` +
        encodeURIComponent(req.query.gremlin), undefined, undefined, req, "gremlin").then((res) => res)

      data = await response.json();
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

  app.get("/pg/statistics/summary", async (req, res, next) => {
    let response;
    let data;
    try {
      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/pg/statistics/summary`, undefined, undefined, req, "gremlin").then((res) => res)

      data = await response.json();
      res.send(data);
    } catch (error) {
      if (!error.extraInfo && req.headers["graph-db-connection-url"] !== undefined) {
        error.extraInfo = "Check that your instance type supports the summary statistics.";
      }

      next(error);
    }
  });

  app.get("/rdf/statistics/summary", async (req, res, next) => {
    let response;
    let data;
    try {
      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/rdf/statistics/summary`, undefined, undefined, req, "sparql").then((res) => res)

      data = await response.json();
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

  if (process.env.PROXY_SERVER_HTTPS_CONNECTION != "false" && fs.existsSync("../graph-explorer-proxy-server/cert-info/server.key") && fs.existsSync("../graph-explorer-proxy-server/cert-info/server.crt")) {
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