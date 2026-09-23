import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import App from "./App";
import "./index.css";

const BootstrapApp = () => {
  return (
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<BootstrapApp />);
