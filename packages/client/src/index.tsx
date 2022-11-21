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
} else if (import.meta.env.REACT_APP_CONNECTION_URL) {
  config = {
    id: import.meta.env.REACT_APP_CONNECTION_URL,
    connection: {
      url: import.meta.env.REACT_APP_CONNECTION_URL,
      queryEngine:
        (import.meta.env.REACT_APP_CONNECTION_ENGINE as
          | "gremlin"
          | "sparql"
          | undefined) || "gremlin",
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
