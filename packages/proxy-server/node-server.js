const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();

dotenv.config({ path: "../client/.env.development" });

const BASE_URL = process.env.PROXY_SERVER_CONNECTION_URL.replace(/\/$/, "");
const BASE_PORT = 8182;

app.use(cors());

app.get("/sparql", async (req, res, next) => {
  console.log("GET /sparql", req.query.query);
  try {
  	req.headers['host'] = process.env.REACT_APP_AWS_CLUSTER_HOST;
  	const response = await fetch(`${BASE_URL}/sparql?query=` + encodeURIComponent(req.query.query) + "&format=json", {"headers": req.headers});
  	const data = await response.json();
  	res.send(data);
  } catch(error) {
    next(error);
    console.log(error);
  }
});

app.get("/", async (req, res, next) => {
  console.log("GET /", req.query.gremlin);
  try {
  	req.headers['host'] = process.env.REACT_APP_AWS_CLUSTER_HOST;
  	const response = await fetch(`${BASE_URL}/?gremlin=` + req.query.gremlin, {"headers": req.headers});
  	const data = await response.json();
  	res.send(data);
  } catch(error) {
    next(error);
    console.log(error);
  }
});

app.listen(BASE_PORT, () => {
  console.log(`Proxing to ${BASE_URL}`);
  console.log(`\tLocal http://localhost:${BASE_PORT}`);
});