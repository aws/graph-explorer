interface LifecycleLogger {
  info: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  fatal: (msg: string, ...args: unknown[]) => void;
}

/** The subset of `http.Server` the lifecycle handlers depend on. */
export interface LifecycleServer {
  on(event: "error", handler: (error: NodeJS.ErrnoException) => void): unknown;
  close(onClosed?: () => void): unknown;
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
        `Port ${port} is already in use — another proxy server or worktree may already be running.`,
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
  onSignal: (signal: string, handler: () => void) => void;
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

    server.close(() => {
      clearTimeout(timer);
      logger.info("HTTP server closed");
      exit(0);
    });
  }

  onSignal("SIGTERM", () => shutdown("SIGTERM"));
  onSignal("SIGINT", () => shutdown("SIGINT"));
}
