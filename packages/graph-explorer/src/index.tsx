import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router";
import App from "./App";
import { RawConfiguration } from "./core";
import ConnectedProvider from "./core/ConnectedProvider";
import "./index.css";
import "@mantine/core/styles.css";
import { DEFAULT_SERVICE_TYPE } from "./utils/constants";
import "core-js/full/iterator";
import { logger } from "./utils";

const grabConfig = async (): Promise<RawConfiguration | undefined> => {
  const defaultConnectionPath = `${location.origin}/defaultConnection`;
  const sagemakerConnectionPath = `${location.origin}/proxy/9250/defaultConnection`;
  let defaultConnectionFile;

  try {
    logger.debug(
      "Attempting to find default connection file at",
      defaultConnectionPath
    );
    defaultConnectionFile = await fetch(defaultConnectionPath);

    if (!defaultConnectionFile.ok) {
      logger.debug(
        `Failed to find default connection file at .../defaultConnection, trying path for Sagemaker.`,
        sagemakerConnectionPath
      );
      defaultConnectionFile = await fetch(sagemakerConnectionPath);
      if (defaultConnectionFile.ok) {
        logger.log(
          `Found default connection file at ../proxy/9250/defaultConnection.`
        );
      } else {
        logger.debug(
          `Did not find default connection file at ../proxy/9250/defaultConnection. No defaultConnectionFile will be set.`
        );
      }
    } else {
      logger.log(`Found default connection file at ../defaultConnection.`);
    }

    const contentType = defaultConnectionFile.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      logger.debug(`Default config response is not JSON`);
      return;
    }

    const defaultConnectionData = await defaultConnectionFile.json();
    logger.debug("Default connection data", defaultConnectionData);
    const config: RawConfiguration = {
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
    logger.debug("Default connection created", config);
    return config;
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
      <Router>
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
