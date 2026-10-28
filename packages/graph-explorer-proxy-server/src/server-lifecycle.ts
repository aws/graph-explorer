import { type AddressInfo, isIPv6, type ListenOptions } from "net";

interface LifecycleLogger {
  info: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  fatal: (msg: string, ...args: unknown[]) => void;
}

/** The subset of `http.Server` the shutdown handler depends on. */
export interface LifecycleServer {
  close(onClosed?: (error?: Error) => void): unknown;
}

/** The subset of `http.Server` that {@link startListening} depends on. */
export interface ListeningServer {
  on(event: "error", handler: (error: NodeJS.ErrnoException) => void): unknown;
  listen(options: ListenOptions, onListening: () => void): unknown;
  address(): AddressInfo | string | null;
}

export interface StartListeningOptions {
  address: string;
  port: number;
  logger: LifecycleLogger;
  exit: (code: number) => void;
  onListening: () => void;
}

const allInterfacesAddresses = new Set(["::", "0.0.0.0"]);

/**
 * Listens on `address` and `port`, then logs the address the server bound.
 * The all-interfaces addresses listen with no host, which keeps Node's
 * IPv6-first bind and its IPv4 fallback on hosts without IPv6. A server error
 * is logged with the setting to change and exits with code 1.
 */
export function startListening(
  server: ListeningServer,
  { address, port, logger, exit, onListening }: StartListeningOptions,
) {
  server.on("error", (error: NodeJS.ErrnoException) => {
    logger.fatal(describeServerError(error, address, port));
    exit(1);
  });
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

function describeServerError(
  error: NodeJS.ErrnoException,
  address: string,
  port: number,
) {
  if (error.code === "EADDRINUSE") {
    return `Port ${port} is already in use — another proxy server or worktree may already be running. Stop the other process or set a different port.`;
  }
  if (error.code === "EACCES") {
    return `Permission denied listening on ${address} port ${port}. Ports below 1024 need elevated privileges on most systems, and on macOS that includes 127.0.0.1. Set PROXY_SERVER_PORT to 1024 or higher.`;
  }
  if (error.code === "EADDRNOTAVAIL") {
    return `PROXY_SERVER_LISTEN_ADDRESS is ${address}, which isn't an address of this machine. Set it to the address of one of this machine's network interfaces, such as 127.0.0.1.`;
  }
  return `Server error: ${error.message}`;
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
