import queryString from "query-string";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import { RawConfiguration } from "./core";
import ConnectedProvider from "./core/ConnectedProvider";
import "./index.css";

const grabConfig = async (): Promise<RawConfiguration | undefined> => {
  const defaultConnectionPath = `${location.origin}/defaultConnection`;
  const sagemakerConnectionPath = `${location.origin}/proxy/9250/defaultConnection`;
  let defaultConnectionFile;

  const params = queryString.parse(location.search) as {
    configFile?: string;
  };

  if (params.configFile) {
    return {
      id: params.configFile,
      remoteConfigFile: params.configFile,
    };
  }

  try {
    defaultConnectionFile = await fetch(defaultConnectionPath);

    if (!defaultConnectionFile.ok) {
      console.log(`Failed to find default connection file at .../defaultConnection, trying path for Sagemaker.`);
      defaultConnectionFile = await fetch(sagemakerConnectionPath);
      if (defaultConnectionFile.ok) {
        console.log(`Found file at ../proxy/9250/defaultConnection.`);
      }
      else {
        console.log(`Did not find file at ../proxy/9250/defaultConnection. No defaultConnectionFile will be set.`);
      }
    } else {
      console.log(`Found file at ../defaultConnection.`);
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
        proxyConnection: !!defaultConnectionData.GRAPH_EXP_USING_PROXY_SERVER,
        graphDbUrl: defaultConnectionData.GRAPH_EXP_CONNECTION_URL || "",
        awsAuthEnabled: !!defaultConnectionData.GRAPH_EXP_IAM,
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
