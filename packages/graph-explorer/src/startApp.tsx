import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

import App from "./App";
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

/** Loads persisted state, then renders the app into `container`. */
export async function startApp(container: HTMLElement): Promise<void> {
  const root = createRoot(container);
  await loadPersistedState();
  root.render(<BootstrapApp />);
}
