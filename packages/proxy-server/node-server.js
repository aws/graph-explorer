const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const AWS = require("aws-sdk");
const { RequestSig } = require("./RequestSig.js");

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

dotenv.config({ path: "../client/.env.development" });

const BASE_URL = process.env.PROXY_SERVER_CONNECTION_URL.replace(/\/$/, "");
const BASE_PORT = 8182;

(async () => {
  if (process.env.REACT_APP_AWS_SERVICE == "neptune-db") {
    const connection_details = await (await fetch(new URL(`${BASE_URL}/status`))).json();
    if (connection_details.role !== "reader") {
      throw new Error("Neptune connection is not read only");
    }
  }

  let creds;
  let requestSig;
  if (process.env.REACT_APP_AWS_AUTH_REQUIRED) {
    creds = await getCredentials();
    requestSig = await new RequestSig(creds[0], creds[1], creds[2]);
  }
  app.use(cors());
  app.get("/sparql", async (req, res, next) => {
    try {
      if (process.env.REACT_APP_AWS_AUTH_REQUIRED) {
        const authHeaders = await requestSig.requestAuthHeaders(new URL(`${BASE_URL}/sparql?query=` + encodeURIComponent(req.query.query) + "&format=json"), "GET");
        req.headers['Authorization'] = authHeaders["Authorization"];
        req.headers['x-amz-date'] = authHeaders['x-amz-date'];
        if (authHeaders['x-amz-security-token']) {
          req.headers['x-amz-security-token'] = authHeaders['x-amz-security-token'];
        }
      }
      req.headers["host"] = process.env.REACT_APP_AWS_CLUSTER_HOST;
      const response = await fetch(
        `${BASE_URL}/sparql?query=` +
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
      if (process.env.REACT_APP_AWS_AUTH_REQUIRED) {
        const authHeaders = await requestSig.requestAuthHeaders(new URL(`${BASE_URL}/?gremlin=` + req.query.gremlin), "GET");
        req.headers['Authorization'] = authHeaders["Authorization"];
        req.headers['x-amz-date'] = authHeaders['x-amz-date'];
        if (authHeaders['x-amz-security-token']) {
          req.headers['x-amz-security-token'] = authHeaders['x-amz-security-token'];
        }
      }
      req.headers["host"] = process.env.REACT_APP_AWS_CLUSTER_HOST;
      const response = await fetch(`${BASE_URL}/?gremlin=` + req.query.gremlin, {
        headers: req.headers,
      });
      const data = await response.json();
      res.send(data);
    } catch (error) {
      next(error);
      console.log(error);
    }
  });

  app.listen(BASE_PORT, async () => {
    console.log(`Proxing to ${BASE_URL}`);
    console.log(`\tLocal http://localhost:${BASE_PORT}`);
  });
})();
