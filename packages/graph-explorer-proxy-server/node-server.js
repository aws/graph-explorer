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

dotenv.config({ path: "../graph-explorer/.env" });

<<<<<<< HEAD
<<<<<<< HEAD
=======
const BASE_PORT = 8182;

>>>>>>> beca7aa (12/09 12:22PM push)
=======
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
(async () => {
  let creds = await getCredentials();
  let requestSig;

  app.use(cors());

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
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
      console.log("No endpoint passed");
    }
<<<<<<< HEAD

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
    try {
      const reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
      const endpoint_url = reqObjects[0];
      const endpoint = reqObjects[1];
      const requestSig = reqObjects[2];

      await getAuthHeaders("sparql", req, endpoint_url, requestSig);
=======
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
=======
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))

    return [new URL(endpoint_input), endpoint_input, requestSig];
  }

  async function getAuthHeaders(language, req, endpoint_url, requestSig) {
    let authHeaders 
    if (language == "sparql") {
      authHeaders = await requestSig.requestAuthHeaders(
        endpoint_url.port,
        "/sparql?query=" + encodeURIComponent(req.query.query) + "&format=json"
      );
<<<<<<< HEAD
      req.headers["Authorization"] = authHeaders["headers"]["Authorization"];
      req.headers["X-Amz-Date"] = authHeaders["headers"]["X-Amz-Date"];
      if (authHeaders["headers"]["X-Amz-Security-Token"]) {
        req.headers["X-Amz-Security-Token"] =
          authHeaders["headers"]["X-Amz-Security-Token"];
      }
      req.headers["host"] = new URL(endpoint).host;
>>>>>>> beca7aa (12/09 12:22PM push)
=======
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
    try {
      const reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
      const endpoint_url = reqObjects[0];
      const endpoint = reqObjects[1];
      const requestSig = reqObjects[2];

      await getAuthHeaders("sparql", req, endpoint_url, requestSig);
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))

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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
      const reqObjects = await getRequestObjects(req.headers["graph-db-connection-url"], req.headers["aws-neptune-region"]);
      const endpoint_url = reqObjects[0];
      const endpoint = reqObjects[1];
      const requestSig = reqObjects[2];
<<<<<<< HEAD

      await getAuthHeaders("gremlin", req, endpoint_url, requestSig);

      const response = await fetch(
        `${endpoint}/?gremlin=` + 
        encodeURIComponent(req.query.gremlin),
=======
      let endpoint;
      const endpoint_input = req.headers["graph-db-connection-url"];
      const region_input = req.headers["aws-neptune-region"];
=======
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))

      await getAuthHeaders("gremlin", req, endpoint_url, requestSig);

      const response = await fetch(
<<<<<<< HEAD
        `${endpoint}/?gremlin=` + encodeURIComponent(req.query.gremlin),
>>>>>>> beca7aa (12/09 12:22PM push)
=======
        `${endpoint}/?gremlin=` + 
        encodeURIComponent(req.query.gremlin),
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
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

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  if (process.env.PROXY_SERVER_HTTPS_CONNECTION != false) {
=======
  if (process.env.HTTPS_PROXY_SERVER_CONNECTION != "false") {
>>>>>>> beca7aa (12/09 12:22PM push)
=======
  if (process.env.HTTPS_PROXY_SERVER_CONNECTION != false) {
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
=======
  if (process.env.PROXY_SERVER_HTTPS_CONNECTION != false) {
>>>>>>> d9d360e (12/14 7:50PM push (Address some requested label changes, adding https to graph explorer url, adding format to sparql endpoint))
=======
  if (process.env.PROXY_SERVER_HTTPS_CONNECTION != "false") {
>>>>>>> aa8c3e1 (proxy fix)
=======
  if (process.env.PROXY_SERVER_HTTPS_CONNECTION != "false") {
>>>>>>> 471fd189b1b0ddcab836de6768d57e810ba02bc6
    https
      .createServer(
        {
          key: fs.readFileSync("./cert-info/server.key"),
          cert: fs.readFileSync("./cert-info/server.crt"),
        },
        app
      )
<<<<<<< HEAD
<<<<<<< HEAD
      .listen(8182, async () => {
        console.log(`\tProxy server located at https://localhost:8182`);
      });
  } else {
    app.listen(8182, async () => {
      console.log(`\tProxy server located at http://localhost:8182`);
=======
      .listen(BASE_PORT, async () => {
        console.log(`\tProxy server located at https://localhost:${BASE_PORT}`);
      });
  } else {
    app.listen(BASE_PORT, async () => {
      console.log(`\tProxy server located at http://localhost:${BASE_PORT}`);
>>>>>>> beca7aa (12/09 12:22PM push)
=======
      .listen(8182, async () => {
        console.log(`\tProxy server located at https://localhost:8182`);
      });
  } else {
    app.listen(8182, async () => {
      console.log(`\tProxy server located at http://localhost:8182`);
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
    });
  }
})();
