import dotenv from "dotenv";
import fs from "fs";

import packageJson from "../package.json" with { type: "json" };
import { createApp } from "./app.ts";
import {
  CertificateError,
  generateCertificates,
  prepareCertificates,
  recordContainerStart,
} from "./certificates.ts";
import { handleError } from "./error-handler.ts";
import { createLogger } from "./logging.ts";
import {
  certificateDir,
  clientRoot,
  configJsonPath,
  containerStartMarkerPath,
} from "./paths.ts";
import {
  logStartupWarnings,
  resolveServerConfig,
  ServerConfigError,
} from "./server-config.ts";
import { attachGracefulShutdown, startListening } from "./server-lifecycle.ts";
import { createServer } from "./server.ts";
import { loadStartup, StartupError } from "./startup-config.ts";

/**
 * Resolves the startup configuration and runs the server. With `image` set,
 * it starts as the Docker image's startup scripts did, setting up the
 * self-signed certificate before the server starts.
 */
export function runServer({ image }: { image: boolean }): void {
  const configPath = process.env.CONFIGURATION_FOLDER_PATH ?? clientRoot;
  const startedBefore = image && fs.existsSync(containerStartMarkerPath);
  let loaded;
  try {
    loaded = loadStartup({
      processEnv: process.env,
      configPath,
      configJsonPath,
      image,
      startedBefore,
    });
  } catch (error) {
    if (error instanceof StartupError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
  const { env, startup } = loaded;

  // Libraries such as the AWS SDK read process.env, which a .env file has always been able to set.
  dotenv.populate(process.env, startup.envFileValues);

  const logger = createLogger(env);
  logger.info("Parsed environment values: %o", env);
  for (const warning of startup.warnings) {
    logger.warn(warning);
  }
  if (image) {
    recordContainerStart(containerStartMarkerPath, logger);
  }

  if (startup.httpsNotice) {
    logger.info(startup.httpsNotice);
  }
  if (image && startup.setUpCertificates) {
    try {
      prepareCertificates({
        certDir: certificateDir,
        host: startup.certificateHost,
        generate: generateCertificates,
        logger,
      });
    } catch (error) {
      if (error instanceof CertificateError) {
        logger.fatal(error.message);
        process.exit(1);
      }
      throw error;
    }
  }

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

  logStartupWarnings(serverConfig.startupWarnings, logger);

  const {
    listenAddress,
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
    defaultConnectionJson: startup.defaultConnectionJson,
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
  logger.info(
    "Hosting client side static files at: %s",
    staticFilesVirtualPath,
  );

  const server = createServer(app, {
    useHttps,
    certKeyPath: certificateKeyFilePath,
    certPath: certificateFilePath,
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
  startListening(server, {
    address: listenAddress,
    port,
    logger,
    exit: code => process.exit(code),
    onListening: () =>
      logger.info(
        `Graph Explorer UI located at: ${baseUrl}${staticFilesVirtualPath}`,
      ),
  });
}
