import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router";
import App from "./App";
import ConnectedProvider from "./core/ConnectedProvider";
import "core-js/full/iterator";

import "./index.css";
import "@mantine/core/styles.css";

const BootstrapApp = () => {
  return (
    <React.StrictMode>
      <Router>
        <ConnectedProvider>
          <App />
        </ConnectedProvider>
      </Router>
    </React.StrictMode>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<BootstrapApp />);
