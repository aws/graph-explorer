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
const pretty = require('pino-pretty');

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
    target: 'pino-pretty'
  },
  options: { destination: './logs/app.log' }
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
    target: 'pino-pretty'
  },
  options: { destination: './logs/proxy-server.log' }
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
  console.log( `Error: ${error.message}`);
  const status = error.status || 400;
  response.status(status).send("The following error occurred. You can check the logs for more information. Error: " + error.message);

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
        throw new Error("Credentials still undefined. Check that the environment has an appropriate IAM role that trusts it and that it has sufficient read permissions to connect to Neptune.")
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
          .catch(async (err) => {
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
              reject(err);
              proxyLogger.error("Still receiving error after credential refresh:\n " + err);
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
          proxyLogger.error("Attempted to create the authentication headers necessary for AWS SigV4, but received an invalid url. Check that the \"Graph Connection URL\" field in your configuration is properly formatted and that requests to the proxy server have a \"graph-db-connection-url\" header with the URL provided in your configuration.");
        } else {
          proxyLogger.error("Unexpected TypeError:\n" + error);
        }
      } else {
        proxyLogger.error("Unexpected error:\n" + error);
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
      next(error);
      proxyLogger.error("There was a problem with a sparql request. The request made was " + 
                        `${req.headers["graph-db-connection-url"]}/sparql?query=` +
                        encodeURIComponent(req.query.query) +
                        "&format=json and the error received was: \n" + error);
    }
  });
  
  app.get('/logger', (req, res) => {
    // create a new WebSocket server
    const wss = new WebSocket.Server({ noServer: true });
    
    // listen for incoming WebSocket connections
    wss.on('connection', (socket) => {
      console.log('WebSocket connection established');
    
      // listen for incoming messages from the client
      socket.on('message', (message) => {
        console.log(`Received message from client: ${message}`);
        socket.send(`You sent: ${message}`);
      });
    
      // listen for the socket to close
      socket.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    appLogger.info("jsk")
    
    // upgrade the incoming request to a WebSocket connection
    req.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
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
      proxyLogger.error("There was a problem with a gremlin request. The request made was " + 
                        `${req.headers["graph-db-connection-url"]}/?gremlin=` +
                        encodeURIComponent(req.query.gremlin) + " and the error received was: \n" + error);
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