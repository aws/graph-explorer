import dotenv from "dotenv";
import path from "path";

import { createApp } from "./app.js";
import { parseEnvironmentValues } from "./env.js";
import { handleError } from "./error-handler.js";
import { createLogger } from "./logging.js";
import { clientRoot, isDirectory } from "./paths.js";
import { resolveServerConfig, ServerConfigError } from "./server-config.js";
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

let serverConfig;
try {
  serverConfig = resolveServerConfig(env);
} catch (error) {
  if (error instanceof ServerConfigError) {
    logger.fatal(error.message);
    process.exit(1);
  }
  throw error;
}

const {
  port,
  baseUrl,
  certificateKeyFilePath,
  certificateFilePath,
  staticFilesVirtualPath,
  staticFilesPath,
  useHttps,
} = serverConfig;

const app = createApp({ configPath, staticFilesVirtualPath, staticFilesPath });

// Store logger on app.locals for access in middleware and routes
app.locals.logger = logger;

// Log static file hosting info
logger.info("Hosting client side static files from: %s", staticFilesPath);
logger.info("Hosting client side static files at: %s", staticFilesVirtualPath);

const server = createServer(app, {
  useHttps,
  certKeyPath: certificateKeyFilePath,
  certPath: certificateFilePath,
});

// Start the server
server.listen(port, () => {
  logger.info(`Proxy server located at ${baseUrl}`);
  logger.info(
    `Graph Explorer UI located at: ${baseUrl}${staticFilesVirtualPath}`,
  );
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
