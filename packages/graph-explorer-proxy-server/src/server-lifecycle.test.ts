import {
  attachGracefulShutdown,
  attachServerErrorHandler,
  type LifecycleServer,
} from "./server-lifecycle.ts";

function createMockServer({
  hangOnClose = false,
  closeError,
}: { hangOnClose?: boolean; closeError?: Error } = {}) {
  const errorHandlers: Array<(error: NodeJS.ErrnoException) => void> = [];
  const close = vi.fn((onClosed?: (error?: Error) => void) => {
    if (!hangOnClose) onClosed?.(closeError);
  });
  const server: LifecycleServer = {
    on: (_event, handler) => errorHandlers.push(handler),
    close,
  };
  return {
    server,
    close,
    emitError: (error: NodeJS.ErrnoException) =>
      errorHandlers.forEach(handler => handler(error)),
  };
}

function createMockLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  };
}

function createSignalBus() {
  const handlers = new Map<string, Array<() => void>>();
  return {
    onSignal: (signal: "SIGTERM" | "SIGINT", handler: () => void) => {
      const existing = handlers.get(signal) ?? [];
      handlers.set(signal, [...existing, handler]);
    },
    emit: (signal: "SIGTERM" | "SIGINT") =>
      handlers.get(signal)?.forEach(handler => handler()),
  };
}

describe("attachServerErrorHandler", () => {
  it("exits with code 1 on EADDRINUSE", () => {
    const { server, emitError } = createMockServer();
    const logger = createMockLogger();
    const exit = vi.fn();

    attachServerErrorHandler(server, { port: 8080, logger, exit });

    emitError(
      Object.assign(new Error("listen EADDRINUSE"), { code: "EADDRINUSE" }),
    );

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.fatal).toHaveBeenCalled();
    expect(logger.fatal.mock.calls[0][0]).toContain("8080");
  });

  it("exits with code 1 on other server errors", () => {
    const { server, emitError } = createMockServer();
    const logger = createMockLogger();
    const exit = vi.fn();

    attachServerErrorHandler(server, { port: 443, logger, exit });

    emitError(
      Object.assign(new Error("permission denied"), { code: "EACCES" }),
    );

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.fatal).toHaveBeenCalled();
  });
});

describe("attachGracefulShutdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls server.close and exits 0 on SIGTERM", () => {
    const { server, close } = createMockServer();
    const logger = createMockLogger();
    const exit = vi.fn();
    const signals = createSignalBus();

    attachGracefulShutdown(server, {
      logger,
      exit,
      onSignal: signals.onSignal,
    });

    signals.emit("SIGTERM");

    expect(close).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("calls server.close and exits 0 on SIGINT", () => {
    const { server, close } = createMockServer();
    const logger = createMockLogger();
    const exit = vi.fn();
    const signals = createSignalBus();

    attachGracefulShutdown(server, {
      logger,
      exit,
      onSignal: signals.onSignal,
    });

    signals.emit("SIGINT");

    expect(close).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("force-exits after timeout if server.close hangs", () => {
    vi.useFakeTimers();

    const { server } = createMockServer({ hangOnClose: true });
    const logger = createMockLogger();
    const exit = vi.fn();
    const signals = createSignalBus();

    attachGracefulShutdown(server, {
      logger,
      exit,
      onSignal: signals.onSignal,
      forceExitTimeout: 3000,
    });

    signals.emit("SIGTERM");

    expect(exit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it("exits 1 and logs when server.close reports an error", () => {
    const closeError = new Error("Not running");
    const { server } = createMockServer({ closeError });
    const logger = createMockLogger();
    const exit = vi.fn();
    const signals = createSignalBus();

    attachGracefulShutdown(server, {
      logger,
      exit,
      onSignal: signals.onSignal,
    });

    signals.emit("SIGTERM");

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it("does not double-exit on repeated signals", () => {
    const { server } = createMockServer();
    const logger = createMockLogger();
    const exit = vi.fn();
    const signals = createSignalBus();

    attachGracefulShutdown(server, {
      logger,
      exit,
      onSignal: signals.onSignal,
    });

    signals.emit("SIGTERM");
    signals.emit("SIGINT");

    expect(exit).toHaveBeenCalledTimes(1);
  });
});
