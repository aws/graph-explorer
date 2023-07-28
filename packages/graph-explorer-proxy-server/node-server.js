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
const e = require("express");

async function getIAMHeaders(options) {
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

dotenv.config({ path: "../graph-explorer/.env" });

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
      next(error);
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
      next(error);
    }
  });

  app.get("/rdf/statistics/summary", async (req, res, next) => {
    try {
      const url = new URL(
        `${req.headers["graph-db-connection-url"]}/rdf/statistics/summary`
      );
      const headers = req.headers;
      const response = await retryFetch(url, headers);
      const data = await response.json();
      res.send(data);
    } catch (error) {
      // send the json response in the next call
      res.send(error);
    }
  });

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
        console.log(`\tProxy server located at https://localhost`);
      });
  } else {
    app.listen(80, async () => {
      console.log(`\tProxy server located at http://localhost`);
    });
  }
})();
