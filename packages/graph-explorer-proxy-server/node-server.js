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
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const aws4 = require("aws4");


const getCredentials = async () => {
  try {
    const credentialProvider = fromNodeProviderChain();
    const results = await credentialProvider();
    console.log("IAM credentials were found in provider chain and will be used to sign requests");
    return results;
  } catch (e) {
    console.error("No IAM credentials found in provider chain", e);
  }
};

async function getIAMHeaders(options) {

  let creds = await getCredentials();
  if (creds === undefined) {
    throw new Error("IAM is enabled but credentials cannot be found on the credential provider chain.")
  }
  const headers = aws4.sign(options, {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken
  }).headers;

  return headers;
}

dotenv.config({ path: "../graph-explorer/.env" });

(async () => {

  app.use(cors());

  app.use(process.env.GRAPH_EXP_ENV_ROOT_FOLDER, express.static(path.join(__dirname, "../graph-explorer/dist")));

  const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

  async function retryFetch (
    url,
    headers,
    retries = 1,
    retryDelay = 10000
  ) {

    if (headers["aws-neptune-region"]) {
      await getIAMHeaders({
        host: url.hostname,
        port: url.port,
        path: url.pathname+url.search,
        service: "neptune-db",
        region: headers["aws-neptune-region"]
      }).then(data => {  
        headers = data;
      });
    } 

    return new Promise((resolve, reject) => {
      
      urlString = url.href;
      method = "GET";

      console.log("url: ", urlString);
      console.log

      const wrapper = (n) => {
        fetch(url.href, { headers: headers })
          .then( async res => {
            if (!res.ok) {
              result = await res.json();
              console.log("Bad response: ", res.statusText);
              console.log("Error message: ", result);
              const error = res.status
              return Promise.reject(error);
            } else {
              console.log("Successful response: "+res.statusText);
              resolve(res);
            }
          })
          .catch(async (err) => {
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

  app.get("/sparql", async (req, res, next) => {
    let response;
    let data;
    try {
      response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/sparql?query=` +
          encodeURIComponent(req.query.query) +
          "&format=json"
        ), 
        req.headers
      ).then((res) => res)

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
      response = await retryFetch(
        new URL(
          `${req.headers["graph-db-connection-url"]}/?gremlin=` + 
          encodeURIComponent(req.query.gremlin)
        ), 
        req.headers
      ).then((res) => res)

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
      response = await retryFetch(
        new URL(`${req.headers["graph-db-connection-url"]}/pg/statistics/summary`), 
        req.headers
      ).then((res) => res)

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
    let url = new URL(`${req.headers["graph-db-connection-url"]}/rdf/statistics/summary`)
    let headers = req.headers
    try {
      response = await retryFetch(
        url, 
        headers
      ).then((res) => res)

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
