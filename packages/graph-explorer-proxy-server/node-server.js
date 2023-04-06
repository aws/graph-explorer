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
        console.log("Master credentials available");
        resolve(creds);
      });
    });
  } catch (e) {
    console.error("No master credentials available", e);
  }

  return credentials;
};

dotenv.config({ path: "../graph-explorer/.env" });
  
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
      console.error("Credentials undefined. Trying refresh.");
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
	            console.log("Response not ok");
              const error = res.status
              return Promise.reject(error);
            } else {
	            console.log("Response ok");
              resolve(res);
            }
          })
          .catch(async (err) => {
            console.log("Attempt Credential Refresh");
	          creds = await getCredentials();
            if (creds === undefined) {
              reject("Credentials undefined after credential refresh. Check that you have proper acccess")
            }
            reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
            await getAuthHeaders(language, req, reqObjects[0], reqObjects[2]);

            if (n > 0) {
              await delay(retryDelay);
              wrapper(--n);
            } else {
              reject(err);
            }
          });
      };

      wrapper(retries);
    });
  };

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
      console.log(error);
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