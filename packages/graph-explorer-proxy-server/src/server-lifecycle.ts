import { type AddressInfo, isIPv6, type ListenOptions } from "net";

interface LifecycleLogger {
  info: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  fatal: (msg: string, ...args: unknown[]) => void;
}

/** The subset of `http.Server` the lifecycle handlers depend on. */
export interface LifecycleServer {
  on(event: "error", handler: (error: NodeJS.ErrnoException) => void): unknown;
  close(onClosed?: (error?: Error) => void): unknown;
}

/** The subset of `http.Server` that {@link startListening} depends on. */
export interface ListeningServer {
  listen(options: ListenOptions, onListening: () => void): unknown;
  address(): AddressInfo | string | null;
}

export interface StartListeningOptions {
  address: string;
  port: number;
  logger: LifecycleLogger;
  onListening: () => void;
}

const allInterfacesAddresses = new Set(["::", "0.0.0.0"]);

/**
 * Listens on `address` and `port`, then logs the address the server bound.
 * The all-interfaces addresses listen with no host, which keeps Node's
 * IPv6-first bind and its IPv4 fallback on hosts without IPv6.
 */
export function startListening(
  server: ListeningServer,
  { address, port, logger, onListening }: StartListeningOptions,
) {
  const options: ListenOptions = allInterfacesAddresses.has(address)
    ? { port }
    : { port, host: address };
  server.listen(options, () => {
    const bound = server.address();
    if (bound === null || typeof bound === "string") {
      throw new Error("The proxy server must listen on a TCP address");
    }
    const boundAt = isIPv6(bound.address)
      ? `[${bound.address}]:${bound.port}`
      : `${bound.address}:${bound.port}`;
    logger.info(`Proxy server listening on ${boundAt}`);
    if (isLoopback(bound.address)) {
      logger.info(
        "Only this machine can connect. Set PROXY_SERVER_LISTEN_ADDRESS to listen on other network interfaces.",
      );
    }
    onListening();
  });
}

function isLoopback(address: string) {
  return address === "::1" || address.startsWith("127.");
}

export interface ServerErrorHandlerOptions {
  port: number;
  logger: LifecycleLogger;
  exit: (code: number) => void;
}

export function attachServerErrorHandler(
  server: LifecycleServer,
  { port, logger, exit }: ServerErrorHandlerOptions,
) {
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.fatal(
        `Port ${port} is already in use — another proxy server or worktree may already be running. Stop the other process or set a different port.`,
      );
    } else {
      logger.fatal(`Server error: ${error.message}`);
    }
    exit(1);
  });
}

export interface GracefulShutdownOptions {
  logger: LifecycleLogger;
  exit: (code: number) => void;
  onSignal: (signal: "SIGTERM" | "SIGINT", handler: () => void) => void;
  forceExitTimeout?: number;
}

const DEFAULT_FORCE_EXIT_TIMEOUT = 5000;

export function attachGracefulShutdown(
  server: LifecycleServer,
  { logger, exit, onSignal, forceExitTimeout }: GracefulShutdownOptions,
) {
  const timeout = forceExitTimeout ?? DEFAULT_FORCE_EXIT_TIMEOUT;
  let shuttingDown = false;

  function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`${signal} signal received: closing HTTP server`);

    const timer = setTimeout(() => {
      logger.error("Graceful shutdown timed out, forcing exit");
      exit(1);
    }, timeout);
    timer.unref();

    server.close(err => {
      clearTimeout(timer);
      if (err) {
        logger.error(`Error closing HTTP server: ${err.message}`);
        exit(1);
      } else {
        logger.info("HTTP server closed");
        exit(0);
      }
    });
  }

  onSignal("SIGTERM", () => shutdown("SIGTERM"));
  onSignal("SIGINT", () => shutdown("SIGINT"));
}
