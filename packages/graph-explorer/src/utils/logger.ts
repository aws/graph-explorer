/* oxlint-disable no-console */

import { env } from "./env";

let diagnosticLogging = false;

/** Enables or disables diagnostic logging at runtime. */
export function setDiagnosticLogging(enabled: boolean) {
  diagnosticLogging = enabled;
}

/** Returns true when debug and log calls should be written to the console. */
function isLoggingEnabled() {
  return env.DEV || diagnosticLogging;
}

/** A thin wrapper around console that suppresses debug/log in production unless diagnostic logging is enabled. */
export default {
  /** Calls `console.debug` if the app is running in DEV mode or diagnostic logging is enabled. */
  debug(...args: unknown[]) {
    if (isLoggingEnabled()) {
      console.debug(...args);
    }
  },
  /** Calls `console.log` if the app is running in DEV mode or diagnostic logging is enabled. */
  log(...args: unknown[]) {
    if (isLoggingEnabled()) {
      console.log(...args);
    }
  },
  /** Calls `console.warn`. */
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  /** Calls `console.error`. */
  error(...args: unknown[]) {
    console.error(...args);
  },
};
