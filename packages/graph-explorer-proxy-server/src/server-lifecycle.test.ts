import type { AddressInfo, ListenOptions } from "net";

import http from "http";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import {
  attachGracefulShutdown,
  type LifecycleServer,
  startListening,
} from "./server-lifecycle.ts";

function createMockServer({
  hangOnClose = false,
  closeError,
}: { hangOnClose?: boolean; closeError?: Error } = {}) {
  const close = vi.fn((onClosed?: (error?: Error) => void) => {
    if (!hangOnClose) onClosed?.(closeError);
  });
  const server: LifecycleServer = { close };
  return { server, close };
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

function createMockListeningServer(bound: AddressInfo) {
  const errorHandlers: Array<(error: NodeJS.ErrnoException) => void> = [];
  const listen = vi.fn((_options: ListenOptions, onListening: () => void) =>
    onListening(),
  );
  return {
    server: {
      on: (_event: "error", handler: (error: NodeJS.ErrnoException) => void) =>
        errorHandlers.push(handler),
      listen,
      address: () => bound,
    },
    listen,
    emitError: (error: NodeJS.ErrnoException) =>
      errorHandlers.forEach(handler => handler(error)),
  };
}

const loopbackNote =
  "Only this machine can connect. Set PROXY_SERVER_LISTEN_ADDRESS to listen on other network interfaces.";

describe("startListening", () => {
  function start(
    bound: AddressInfo,
    address: string,
    onListening: () => void = vi.fn(),
  ) {
    const { server, listen } = createMockListeningServer(bound);
    const logger = createMockLogger();
    startListening(server, {
      address,
      port: 8080,
      logger,
      exit: vi.fn(),
      onListening,
    });
    return { listen, logger };
  }

  function startAndFail(address: string, port: number, error: Error) {
    const { server, emitError } = createMockListeningServer({
      address,
      family: "IPv4",
      port,
    });
    const logger = createMockLogger();
    const exit = vi.fn();
    startListening(server, {
      address,
      port,
      logger,
      exit,
      onListening: vi.fn(),
    });
    emitError(error);
    return { logger, exit };
  }

  it("exits with code 1 on EADDRINUSE", () => {
    const { logger, exit } = startAndFail(
      "127.0.0.1",
      8080,
      Object.assign(new Error("listen EADDRINUSE"), { code: "EADDRINUSE" }),
    );

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.fatal).toHaveBeenCalled();
    expect(logger.fatal.mock.calls[0][0]).toContain("8080");
  });

  it("exits with code 1 on other server errors", () => {
    const { logger, exit } = startAndFail(
      "127.0.0.1",
      443,
      Object.assign(new Error("invalid argument"), { code: "EINVAL" }),
    );

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.fatal).toHaveBeenCalledWith("Server error: invalid argument");
  });

  it("explains EACCES with the port settings", () => {
    const { logger, exit } = startAndFail(
      "127.0.0.1",
      80,
      Object.assign(new Error("permission denied"), { code: "EACCES" }),
    );

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.fatal).toHaveBeenCalledWith(
      "Permission denied listening on 127.0.0.1 port 80. Ports below 1024 need elevated privileges on most systems, and on macOS that includes 127.0.0.1. Set PROXY_SERVER_PORT to 1024 or higher.",
    );
  });

  it("explains EADDRNOTAVAIL with the listen address", () => {
    const { logger, exit } = startAndFail(
      "192.0.2.10",
      8080,
      Object.assign(new Error("address not available"), {
        code: "EADDRNOTAVAIL",
      }),
    );

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.fatal).toHaveBeenCalledWith(
      "PROXY_SERVER_LISTEN_ADDRESS is 192.0.2.10, which isn't an address of this machine. Set it to the address of one of this machine's network interfaces, such as 127.0.0.1.",
    );
  });

  it.each(["::", "0.0.0.0"])(
    "listens with no host for %s, keeping Node's IPv4 fallback",
    address => {
      const { listen } = start(
        { address: "::", family: "IPv6", port: 8080 },
        address,
      );

      expect(listen).toHaveBeenCalledWith({ port: 8080 }, expect.any(Function));
      expect(listen.mock.calls[0][0]).not.toHaveProperty("host");
    },
  );

  it("listens on 127.0.0.1 as the host", () => {
    const { listen } = start(
      { address: "127.0.0.1", family: "IPv4", port: 8080 },
      "127.0.0.1",
    );

    expect(listen).toHaveBeenCalledWith(
      { port: 8080, host: "127.0.0.1" },
      expect.any(Function),
    );
  });

  it("logs every interface without the loopback note", () => {
    const { logger } = start({ address: "::", family: "IPv6", port: 80 }, "::");

    expect(logger.info.mock.calls).toStrictEqual([
      ["Proxy server listening on [::]:80"],
    ]);
  });

  it("logs an IPv4 bind", () => {
    const { logger } = start(
      { address: "0.0.0.0", family: "IPv4", port: 80 },
      "0.0.0.0",
    );

    expect(logger.info.mock.calls).toStrictEqual([
      ["Proxy server listening on 0.0.0.0:80"],
    ]);
  });

  it("says only this machine can connect on 127.0.0.1", () => {
    const { logger } = start(
      { address: "127.0.0.1", family: "IPv4", port: 8080 },
      "127.0.0.1",
    );

    expect(logger.info.mock.calls).toStrictEqual([
      ["Proxy server listening on 127.0.0.1:8080"],
      [loopbackNote],
    ]);
  });

  it("says only this machine can connect on ::1", () => {
    const { logger } = start(
      { address: "::1", family: "IPv6", port: 8080 },
      "::1",
    );

    expect(logger.info.mock.calls).toStrictEqual([
      ["Proxy server listening on [::1]:8080"],
      [loopbackNote],
    ]);
  });

  it("calls onListening once listening", () => {
    const onListening = vi.fn();

    start(
      { address: "127.0.0.1", family: "IPv4", port: 8080 },
      "127.0.0.1",
      onListening,
    );

    expect(onListening).toHaveBeenCalledOnce();
  });

  // The Vite dev proxy in packages/graph-explorer/vite.config.ts targets
  // http://localhost:<port>, which Node resolves and falls back to 127.0.0.1.
  it("accepts requests to localhost on 127.0.0.1, as the Vite dev proxy sends them", async () => {
    const server = http.createServer((_request, response) => {
      response.end("OK");
    });
    try {
      await new Promise<void>(resolve =>
        startListening(server, {
          address: "127.0.0.1",
          port: 0,
          logger: createMockLogger(),
          exit: vi.fn(),
          onListening: resolve,
        }),
      );
      const bound = server.address();
      if (bound === null || typeof bound === "string") {
        throw new Error("Expected the server to listen on a TCP address");
      }
      expect(bound.address).toBe("127.0.0.1");

      const status = await new Promise<number | undefined>(
        (resolve, reject) => {
          http
            .get(`http://localhost:${bound.port}/`, response => {
              response.resume();
              resolve(response.statusCode);
            })
            .on("error", reject);
        },
      );

      expect(status).toBe(200);
    } finally {
      server.close();
    }
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
