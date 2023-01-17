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

const getCredentials = async () => {
  let accessKey = "";
  let secretKey = "";
  let token = "";
  const credProvider = new AWS.CredentialProviderChain();
  try {
    const credentials = await new Promise((resolve, reject) => {
      credProvider.resolve(function (err, creds) {
        if (err) {
          reject(err);
          return;
        }
        console.log("Master credentials available");
        resolve(creds);
      });
    });
    accessKey = credentials.accessKeyId;
    secretKey = credentials.secretAccessKey;
    token = credentials.sessionToken;
  } catch (e) {
    let msg = "No master credentials available"
    console.error(msg, e);
    throw new Error(msg, e);
  }

  return [accessKey, secretKey, token];
};

dotenv.config({ path: "../graph-explorer/.env" });

(async () => {
  let creds = await getCredentials();
  let requestSig;

  app.use(cors());

  async function getRequestObjects(endpoint_input, region_input) {
    if (endpoint_input) {
      endpoint_url = new URL(endpoint_input);
      requestSig = await new RequestSig(
        endpoint_url.host,
        region_input,
        creds[0],
        creds[1],
        creds[2]
      );
      endpoint = endpoint_input;
    } else {
      let msg = "No proxy endpoint is provided.";
      console.error(msg);
      throw new Error(msg)
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
      let msg = language + " is not supported.";
      console.log(msg);
      throw new Error(msg);
    }

    req.headers["Authorization"] = authHeaders["headers"]["Authorization"];
    req.headers["X-Amz-Date"] = authHeaders["headers"]["X-Amz-Date"];
    if (authHeaders["headers"]["X-Amz-Security-Token"]) {
      req.headers["X-Amz-Security-Token"] = authHeaders["headers"]["X-Amz-Security-Token"];
    }
    req.headers["host"] = endpoint_url.host;
  }

  app.get("/sparql", async (req, res, next) => {
    try {
      const reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
      const endpoint_url = reqObjects[0];
      const endpoint = reqObjects[1];
      const requestSig = reqObjects[2];

      await getAuthHeaders("sparql", req, endpoint_url, requestSig);
      
      const response = await fetch(
        `${endpoint}/sparql?query=` +
          encodeURIComponent(req.query.query) +
          "&format=json",
        { headers: req.headers }
      );
      
      if (!response.ok){
        let msg = `Error getting response from SPARQL endpoint. [${response.statusText}] with query [${req.query.query}].`
        console.error(msg);
        throw new Error(msg);
      }
      
      const data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.error(error);
    }
  });

  app.get("/", async (req, res, next) => {
    try {
      const reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
      const endpoint_url = reqObjects[0];
      const endpoint = reqObjects[1];
      const requestSig = reqObjects[2];

      await getAuthHeaders("gremlin", req, endpoint_url, requestSig);
      
      const response = await fetch(
        `${endpoint}/?gremlin=` + 
        encodeURIComponent(req.query.gremlin),
        {
          headers: req.headers,
        }
      );
      
      if (!response.ok){
        let msg = `Error getting response from Gremlin Server endpoint. [${response.statusText}] with query [${req.query.gremlin}].`
        console.error(msg);
        throw new Error(msg);
      }
      
      const data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.error(error);
    }
  });

  if (process.env.PROXY_SERVER_HTTPS_CONNECTION != "false") {
    https
      .createServer(
        {
          key: fs.readFileSync("./cert-info/server.key"),
          cert: fs.readFileSync("./cert-info/server.crt"),
        },
        app
      )
      .listen(8182, async () => {
        console.log(`\tProxy server located at https://localhost:8182`);
      });
  } else {
    app.listen(8182, async () => {
      console.log(`\tProxy server located at http://localhost:8182`);
    });
  }
})();
