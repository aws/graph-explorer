import queryString from "query-string";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import { RawConfiguration } from "./core";
import ConnectedProvider from "./core/ConnectedProvider";
import "./index.css";
import "@mantine/core/styles.css";
import { DEFAULT_SERVICE_TYPE } from "./utils/constants";
import "core-js/full/iterator";

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
      // eslint-disable-next-line no-console
      console.log(
        `Failed to find default connection file at .../defaultConnection, trying path for Sagemaker.`
      );
      defaultConnectionFile = await fetch(sagemakerConnectionPath);
      if (defaultConnectionFile.ok) {
        // eslint-disable-next-line no-console
        console.log(`Found file at ../proxy/9250/defaultConnection.`);
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `Did not find file at ../proxy/9250/defaultConnection. No defaultConnectionFile will be set.`
        );
      }
    } else {
      // eslint-disable-next-line no-console
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
        serviceType:
          defaultConnectionData.GRAPH_EXP_SERVICE_TYPE || DEFAULT_SERVICE_TYPE,
        fetchTimeoutMs:
          defaultConnectionData.GRAPH_EXP_FETCH_REQUEST_TIMEOUT || 240000,
        nodeExpansionLimit:
          defaultConnectionData.GRAPH_EXP_NODE_EXPANSION_LIMIT,
      },
    };
  } catch (error) {
    console.error(
      `Error when trying to create connection: ${error instanceof Error ? error.message : "Unexpected error"}`
    );
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
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ConnectedProvider config={config}>
          <App />
        </ConnectedProvider>
      </Router>
    </React.StrictMode>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<BootstrapApp />);
