import dotenv from "dotenv";
import path from "path";

import packageJson from "../package.json" with { type: "json" };
import { createApp } from "./app.ts";
import { parseEnvironmentValues } from "./env.ts";
import { handleError } from "./error-handler.ts";
import { createLogger } from "./logging.ts";
import { clientRoot, isDirectory } from "./paths.ts";
import { resolveServerConfig, ServerConfigError } from "./server-config.ts";
import {
  attachGracefulShutdown,
  attachServerErrorHandler,
} from "./server-lifecycle.ts";
import { createServer } from "./server.ts";

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

const app = createApp({
  configPath,
  staticFilesVirtualPath,
  staticFilesPath,
  version: packageJson.version,
  corsOrigin: env.PROXY_SERVER_CORS_ORIGIN,
  allowedDbOrigins: env.PROXY_SERVER_ALLOWED_DB_ORIGINS,
});

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

attachServerErrorHandler(server, {
  port,
  logger,
  exit: code => process.exit(code),
});

attachGracefulShutdown(server, {
  logger,
  exit: code => process.exit(code),
  onSignal: (signal, handler) => process.on(signal, handler),
});

process.on("uncaughtException", (error: Error) => {
  handleError(error, logger);
  process.exit(1);
});

process.on("unhandledRejection", reason => {
  handleError(reason, logger);
  process.exit(1);
});

// Start the server
server.listen(port, () => {
  logger.info(`Proxy server located at ${baseUrl}`);
  logger.info(
    `Graph Explorer UI located at: ${baseUrl}${staticFilesVirtualPath}`,
  );
});
