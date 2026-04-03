import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { createApp } from "./app.js";
import { parseEnvironmentValues } from "./env.js";
import { handleError } from "./error-handler.js";
import { createLogger } from "./logging.js";
import { clientRoot, isDirectory, proxyServerRoot } from "./paths.js";
import { createServer } from "./server.js";

// Load .env files into process.env before parsing
const configPath = process.env.CONFIGURATION_FOLDER_PATH ?? clientRoot;
if (!isDirectory(configPath)) {
  const source = process.env.CONFIGURATION_FOLDER_PATH
    ? `CONFIGURATION_FOLDER_PATH="${configPath}"`
    : `default config path "${configPath}"`;
  console.error(`Configuration folder does not exist: ${source}`);
  process.exit(1);
}
dotenv.config({
  path: [path.join(configPath, ".env.local"), path.join(configPath, ".env")],
});

const env = parseEnvironmentValues(process.env);

const logger = createLogger(env);
logger.info("Parsed environment values: %o", env);

const staticFilesVirtualPath = "/explorer";
const staticFilesPath = path.join(clientRoot, "dist");

const app = createApp({ configPath, staticFilesVirtualPath, staticFilesPath });

// Store logger on app.locals for access in middleware and routes
app.locals.logger = logger;

// Log static file hosting info
logger.info("Hosting client side static files from: %s", staticFilesPath);
logger.info("Hosting client side static files at: %s", staticFilesVirtualPath);

// Relative paths to certificate files
const certificateKeyFilePath = path.join(
  proxyServerRoot,
  "cert-info/server.key",
);
const certificateFilePath = path.join(proxyServerRoot, "cert-info/server.crt");

// Get the port numbers to listen on
const host = env.HOST;
const httpPort = env.PROXY_SERVER_HTTP_PORT;
const httpsPort = env.PROXY_SERVER_HTTPS_PORT;
const useHttps =
  env.PROXY_SERVER_HTTPS_CONNECTION &&
  fs.existsSync(certificateKeyFilePath) &&
  fs.existsSync(certificateFilePath);

const port = useHttps ? httpsPort : httpPort;

const server = createServer(app, {
  useHttps,
  certKeyPath: certificateKeyFilePath,
  certPath: certificateFilePath,
});

// Log the server locations based on the configuration.
function logServerLocations() {
  const scheme = useHttps ? "https" : "http";
  let portSuffix = "";

  // Only show the port if it is not one of the defaults
  if (useHttps && httpsPort !== 443) {
    portSuffix = `:${httpsPort}`;
  } else if (!useHttps && httpPort !== 80) {
    portSuffix = `:${httpPort}`;
  }

  const baseUrl = `${scheme}://${host}${portSuffix}`;
  logger.info(`Proxy server located at ${baseUrl}`);
  logger.info(
    `Graph Explorer UI located at: ${baseUrl}${staticFilesVirtualPath}`,
  );
}

// Start the server
server.listen(port, () => {
  logServerLocations();
});

process.on("uncaughtException", (error: Error) => {
  handleError(error, logger);
});

process.on("unhandledRejection", reason => {
  handleError(reason, logger);
});

// Watch for shutdown events and close gracefully.
function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info("HTTP server closed");
  });
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
