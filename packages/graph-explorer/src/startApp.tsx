import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import { logger } from "@/utils";

import App from "./App";
import AppErrorPage from "./core/AppErrorPage";
import { loadPersistedState } from "./core/StateProvider/storageAtoms";

function BootstrapApp() {
  return (
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

/**
 * Loads persisted state, then renders the app into `container`, or the app
 * error page when the load fails.
 */
export async function startApp(container: HTMLElement): Promise<void> {
  const root = createRoot(container);
  try {
    await loadPersistedState();
  } catch (error) {
    logger.error("Could not load the saved app state", error);
    root.render(<AppErrorPage error={error} />);
    return;
  }
  root.render(<BootstrapApp />);
}
