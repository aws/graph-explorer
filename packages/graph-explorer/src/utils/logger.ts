/* eslint-disable no-console */

import { env } from "./env";

/*
# DEV NOTE

This is a simple logging utility that will allow `console.log` calls any time
`env.DEV === true`. This will be useful for local development and debugging.

I can imagine a future where this logger has some additional functionality where
it can send errors to the server and maybe allow the use to enable debug logging
at runtime.
*/

export default {
  /** Calls `console.log` if the app is running in DEV mode. */
  debug(message?: any, ...optionalParams: any[]) {
    if (env.PROD) {
      return;
    }
    optionalParams.length > 0
      ? console.debug(message, ...optionalParams)
      : console.debug(message);
  },
  /** Calls `console.log` if the app is running in DEV mode. */
  log(message?: any, ...optionalParams: any[]) {
    if (env.PROD) {
      return;
    }
    optionalParams.length > 0
      ? console.log(message, ...optionalParams)
      : console.log(message);
  },
  /** Calls `console.warn`. */
  warn(message?: any, ...optionalParams: any[]) {
    optionalParams.length > 0
      ? console.warn(message, ...optionalParams)
      : console.warn(message);
  },
  /** Calls `console.error`. */
  error(message?: any, ...optionalParams: any[]) {
    optionalParams.length > 0
      ? console.error(message, ...optionalParams)
      : console.error(message);
  },
};
