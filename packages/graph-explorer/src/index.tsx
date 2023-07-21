import queryString from "query-string";
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import { RawConfiguration } from "./core";
import ConnectedProvider from "./core/ConnectedProvider";
import "./index.css";

const params = queryString.parse(location.search) as {
  configFile?: string;
};

let config: RawConfiguration | undefined = undefined;
if (params.configFile) {
  config = {
    id: params.configFile,
    remoteConfigFile: params.configFile,
  };
} else if (import.meta.env.GRAPH_EXP_CONNECTION_URL) {
  config = {
    id: import.meta.env.GRAPH_EXP_CONNECTION_URL,
    displayLabel:
      import.meta.env.GRAPH_EXP_CONNECTION_NAME ||
      import.meta.env.GRAPH_EXP_CONNECTION_URL,
    connection: {
      url: import.meta.env.GRAPH_EXP_CONNECTION_URL,
      queryEngine:
        (import.meta.env.GRAPH_EXP_CONNECTION_ENGINE as
          | "gremlin"
          | "sparql"
          | undefined) || "gremlin",
    },
  };
} 
else if (import.meta.env.GRAPH_EXP_DB_URL) {
  config = {
    id: import.meta.env.GRAPH_EXP_DB_URL,
    displayLabel:
      import.meta.env.GRAPH_EXP_CONNECTION_NAME ||
      import.meta.env.GRAPH_EXP_DB_URL,
    connection: {
      url: import.meta.env.GRAPH_EXP_DB_PROXY_URL,
      proxyConnection: import.meta.env.GRAPH_EXP_PROXY_CONNECTION,
      enableCache: import.meta.env.GRAPH_EXP_ENABLE_CACHE,
      cacheTimeMs: import.meta.env.GRAPH_EXP_CACHE_TIME,
      awsAuthEnabled: import.meta.env.GRAPH_EXP_AWS_AUTH_ENABLED,
      graphDbUrl: import.meta.env.GRAPH_EXP_DB_URL,
      queryEngine: import.meta.env.GRAPH_EXP_QUERY_ENGINE,
      useCustomAuthToken: true
    },
  };
}

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <ConnectedProvider config={config}>
        <App />
      </ConnectedProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
