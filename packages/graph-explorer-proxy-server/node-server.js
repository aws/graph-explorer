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
const WebSocket = require('ws');
const pino = require('pino');

const appLogger = pino({
  level: 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
      destination: "./logs/app.log"
    }
  }
});

const proxyLogger = pino({
  level: 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
      destination: "./logs/proxy-server.log"
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
    proxyLogger.error("No master credentials found.");
  }

  return credentials;
};

const errorHandler = (error, request, response, next) => {
  console.log(error.message);
  const status = error.status || 400;
  response.status(status).send("The following error occurred. You can check the logs for more information. " + error.message);
}

dotenv.config({ path: "../graph-explorer/.env" });

(async () => {
  let creds = await getCredentials();
  let requestSig;

  app.use(cors());
  app.use("/explorer", express.static(path.join(__dirname, "../graph-explorer/dist")));
  app.use(errorHandler);

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
      proxyLogger.error("Credentials undefined. Trying to find some.");
      creds = await getCredentials();
      if (creds === undefined) {
        proxyLogger.error("Credentials still undefined. Check that the environment has an appropriate IAM role that trusts it and that it has sufficient read permissions to connect to Neptune.");
      }
    }

    reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
    await getAuthHeaders(language, req, reqObjects[0], reqObjects[2]);

    return new Promise((resolve, reject) => {

      const wrapper = (n) => {
        fetch(url, { headers: req.headers, })
          .then(async res => {

            if (!res.ok) {
              proxyLogger.error("The response was not successful and had a " + res.status + "code with a message of \"" + res.statusText + "\".");
              return Promise.reject(res.status);
            } else {
              resolve(res);
            }
          })
          .catch(async (error) => {
            proxyLogger.info("Attempting a credential refresh.")
	          creds = await getCredentials();
            if (creds === undefined) {
              proxyLogger.error("Credentials undefined after credential refresh. Check that you have proper acccess.");
            }
            reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
            await getAuthHeaders(language, req, reqObjects[0], reqObjects[2]);

            if (n > 0) {
              await delay(retryDelay);
              wrapper(--n);
            } else {
              proxyLogger.error("Still receiving error after credential refresh:\n" + error);
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
      if (error instanceof TypeError) {
        if (error.message === "Invalid URL") {
          proxyLogger.error("Attempted to create the authentication headers necessary for AWS SigV4, but received a TypeError. Check that the \"Graph Connection URL\" field in your configuration is properly formatted and that requests to the proxy server have a \"graph-db-connection-url\" header with the URL provided in your configuration.");
        } else {
          proxyLogger.error("Unexpected TypeError:\n" + error);
        }
      } else {
        proxyLogger.error("Unexpected Error:\n" + error);
      }
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
      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/sparql?query=` +
        encodeURIComponent(req.query.query) +
        "&format=json", undefined, undefined, req, "sparql").then((res) => res)

      data = await response.json();
      res.send(data);
    } catch (error) {
      if (req.headers["graph-db-connection-url"] !== undefined) {
        proxyLogger.error("There was a problem with a sparql request. The request made was " + 
                        `${req.headers["graph-db-connection-url"]}/sparql?query=` +
                        encodeURIComponent(req.query.query) +
                        "&format=json and the error received was: " + error.message);
      }
      next(error);
    }
  });

  app.get("/", async (req, res, next) => {
    let response;
    let data;
    try {
      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/?gremlin=` +
        encodeURIComponent(req.query.gremlin), undefined, undefined, req, "gremlin").then((res) => res)

      data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.log(error);
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
      next(error);
      console.log(error);
    }
  });

  app.get("/rdf/statistics/summary", async (req, res, next) => {
    let response;
    let data;
    try {
      response = await retryFetch(`${req.headers["graph-db-connection-url"]}/rdf/statistics/summary`, undefined, undefined, req, "gremlin").then((res) => res)

      data = await response.json();
      res.send(data);
    } catch (error) {
      if (req.headers["graph-db-connection-url"] !== undefined) {
        proxyLogger.error("There was a problem with a gremlin request. The request made was " + 
                        `${req.headers["graph-db-connection-url"]}/?gremlin=` +
                        encodeURIComponent(req.query.gremlin) + " and the error received was: " + error.message);
      }
      next(error);
    }
  });

  app.get('/logger', (req, res) => {
    let message;
    let level;

    try {
      if (req.headers["level"] === undefined) {
        proxyLogger.error("No log level passed.");
      } else {
        level = req.headers["level"];
      }
  
      if (req.headers["message"] === undefined) {
        proxyLogger.error("No log message passed.");
      } else {
        message = req.headers["message"];
      }
  
      if (level.toLowerCase() === "error") {
        appLogger.error(message);
      } else if (level.toLowerCase() === "warn") {
        appLogger.warn(message);
      } else if (level.toLowerCase() === "info") {
        appLogger.info(message);
      } else if (level.toLowerCase() === "debug") {
        appLogger.debug(message);
      } else if (level.toLowerCase() === "trace") {
        appLogger.trace(message);
      } else {
        appLogger.error("Tried to log to an unknown level.");
        throw new Error("Tried to log to an unknown level.");
      }

      res.send("Log received.");
    } catch (error) {
      next(error);
    }
  });

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
        console.log(`\tProxy server located at https://localhost`);
      });
  } else {
    app.listen(80, async () => {
      console.log(`\tProxy server located at http://localhost`);
    });
  }
})();