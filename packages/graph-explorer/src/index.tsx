import queryString from "query-string";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import { RawConfiguration } from "./core";
import ConnectedProvider from "./core/ConnectedProvider";
import "./index.css";

const BootstrapApp = () => {
  const [config, setConfig] = useState<RawConfiguration | undefined>(undefined);

  useEffect(() => {
    const grabConfig = async () => {
      const defaultConnectionPath = `${location.origin}/defaultConnection`;
      const params = queryString.parse(location.search) as {
        configFile?: string;
      };
  
      try {
        const defaultConnectionFile = await fetch(defaultConnectionPath)
  
        if (params.configFile) {
          setConfig({
            id: params.configFile,
            remoteConfigFile: params.configFile,
          });
        } else if (defaultConnectionFile.ok) {
          let defaultConnectionData = await defaultConnectionFile.json();
  
          setConfig({
            id: "Default Connection",
            displayLabel: "Default Connection",
            connection: {
              url: defaultConnectionData.GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT || "",
              queryEngine: (defaultConnectionData.GRAPH_EXP_GRAPH_TYPE.toLowerCase() === "sparql") ? "sparql" : "gremlin",
              proxyConnection: defaultConnectionData.GRAPH_EXP_USING_PROXY_SERVER ? true : false,
              graphDbUrl: defaultConnectionData.GRAPH_EXP_CONNECTION_URL || "",
              awsAuthEnabled: defaultConnectionData.GRAPH_EXP_IAM ? true : false,
              awsRegion: defaultConnectionData.GRAPH_EXP_AWS_REGION || "",
            },
          });
        }
  
      } catch (error) {
        console.error(`Error when trying to create connection: ${error}`); 
      }
    };

    grabConfig();
  }, []);

  return (
    <React.StrictMode>
      <Router>
        <ConnectedProvider config={config}>
          <App />
        </ConnectedProvider>
      </Router>
    </React.StrictMode>
  );
};

ReactDOM.render(
  <BootstrapApp />,
  document.getElementById("root")
);
