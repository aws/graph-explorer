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
      url: import.meta.env.GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT || "",
      queryEngine: (import.meta.env.GRAPH_EXP_GRAPH_TYPE.toLowerCase() === "gremlin" || import.meta.env.GRAPH_EXP_GRAPH_TYPE.toLowerCase() === "sparql") ? import.meta.env.GRAPH_EXP_GRAPH_TYPE.toLowerCase() : "gremlin",
      proxyConnection: (import.meta.env.GRAPH_EXP_USING_PROXY_SERVER.toUpperCase() === "TRUE") ? true : false,
      graphDbUrl: import.meta.env.GRAPH_EXP_CONNECTION_URL || "",
      awsAuthEnabled: (import.meta.env.GRAPH_EXP_IAM.toUpperCase() === "TRUE") ? true : false,
      awsRegion: import.meta.env.GRAPH_EXP_AWS_REGION || "",
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
