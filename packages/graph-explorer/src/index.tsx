import queryString from "query-string";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import { RawConfiguration } from "./core";
import ConnectedProvider from "./core/ConnectedProvider";
import "./index.css";

const grabConfig = async (): Promise<RawConfiguration | undefined> => {
  const params = queryString.parse(location.search) as {
    configFile?: string;
  };

  if (params.configFile) {
    return {
      id: params.configFile,
      remoteConfigFile: params.configFile,
    };
  }

  const defaultConnectionPath = `${location.origin}/defaultConnection`;
  try {
    const defaultConnectionFile = await fetch(defaultConnectionPath);

    if (!defaultConnectionFile.ok) {
      throw new Error(
        `Failed to fetch defaultConnection: ${defaultConnectionFile.status} ${defaultConnectionFile.statusText}`
      );
    }

    const contentType = defaultConnectionFile.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return;
    }

    const defaultConnectionData = await defaultConnectionFile.json();
    return {
      id: "Default Connection",
      displayLabel: "Default Connection",
      connection: {
        url: defaultConnectionData.GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT || "",
        queryEngine: defaultConnectionData.GRAPH_EXP_GRAPH_TYPE,
        proxyConnection: defaultConnectionData.GRAPH_EXP_USING_PROXY_SERVER
          ? true
          : false,
        graphDbUrl: defaultConnectionData.GRAPH_EXP_CONNECTION_URL || "",
        awsAuthEnabled: defaultConnectionData.GRAPH_EXP_IAM ? true : false,
        awsRegion: defaultConnectionData.GRAPH_EXP_AWS_REGION || "",
      },
    };
  } catch (error) {
    console.error(`Error when trying to create connection: ${error.message}`);
  }
};

const BootstrapApp = () => {
  const [config, setConfig] = useState<RawConfiguration | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const config = await grabConfig();
      setConfig(config);
    })();
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

ReactDOM.render(<BootstrapApp />, document.getElementById("root"));
