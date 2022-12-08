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
    console.error("No master credentials available", e);
  }

  return [accessKey, secretKey, token];
};

dotenv.config({ path: "../client/.env" });

const BASE_PORT = 8182;

(async () => {
  let creds = await getCredentials();
  let requestSig;

  app.use(cors());

  app.get("/sparql", async (req, res, next) => {
    try {
      let endpoint;
      const endpoint_input = req.headers["graph-db-connection-url"];
      const region_input = req.headers["aws-neptune-region"];
      if (endpoint_input) {
        requestSig = await new RequestSig(
          new URL(endpoint_input).host,
          region_input,
          creds[0],
          creds[1],
          creds[2]
        );
        endpoint = endpoint_input;
      } else {
        console.log("No endpoint passed");
      }

      const authHeaders = await requestSig.requestAuthHeaders(
        BASE_PORT,
        "/sparql?query=" + encodeURIComponent(req.query.query) + "&format=json"
      );
      req.headers["Authorization"] = authHeaders["headers"]["Authorization"];
      req.headers["X-Amz-Date"] = authHeaders["headers"]["X-Amz-Date"];
      if (authHeaders["headers"]["X-Amz-Security-Token"]) {
        req.headers["X-Amz-Security-Token"] =
          authHeaders["headers"]["X-Amz-Security-Token"];
      }
      req.headers["host"] = new URL(endpoint).host;

      const response = await fetch(
        `${endpoint}/sparql?query=` +
          encodeURIComponent(req.query.query) +
          "&format=json",
        { headers: req.headers }
      );

      const data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.log(error);
    }
  });

  app.get("/", async (req, res, next) => {
    try {
      let endpoint;
      const endpoint_input = req.headers["graph-db-connection-url"];
      const region_input = req.headers["aws-neptune-region"];

      if (endpoint_input) {
        requestSig = await new RequestSig(
          new URL(endpoint_input).host,
          region_input,
          creds[0],
          creds[1],
          creds[2]
        );
        endpoint = endpoint_input;
      } else {
        console.log("No endpoint passed");
      }

      const authHeaders = await requestSig.requestAuthHeaders(
        BASE_PORT,
        "/?gremlin=" + encodeURIComponent(req.query.gremlin)
      );
      req.headers["Authorization"] = authHeaders["headers"]["Authorization"];
      req.headers["X-Amz-Date"] = authHeaders["headers"]["X-Amz-Date"];
      if (authHeaders["headers"]["X-Amz-Security-Token"]) {
        req.headers["X-Amz-Security-Token"] =
          authHeaders["headers"]["X-Amz-Security-Token"];
      }
      req.headers["host"] = new URL(endpoint).host;

      const response = await fetch(
        `${endpoint}/?gremlin=` + encodeURIComponent(req.query.gremlin),
        {
          headers: req.headers,
        }
      );

      const data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.log(error);
    }
  });

  if (process.env.HTTPS_PROXY_SERVER_CONNECTION != "false") {
    https
      .createServer(
        {
          key: fs.readFileSync("./cert-info/server.key"),
          cert: fs.readFileSync("./cert-info/server.crt"),
        },
        app
      )
      .listen(BASE_PORT, async () => {
        console.log(`\tProxy server located at https://localhost:${BASE_PORT}`);
      });
  } else {
    app.listen(BASE_PORT, async () => {
      console.log(`\tProxy server located at http://localhost:${BASE_PORT}`);
    });
  }
})();
