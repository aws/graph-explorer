import { execFileSync } from "child_process";
import express from "express";
import fs from "fs";
import https from "https";
import os from "os";
import path from "path";

import { createServer } from "./server.ts";

function createTestExpressApp() {
  const app = express();
  app.get("/status", (_req, res) => res.send("OK"));
  return app;
}

function createTempCerts() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-server-test-"));
  const keyPath = path.join(tmpDir, "server.key");
  const certPath = path.join(tmpDir, "server.crt");

  execFileSync("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-days",
    "1",
    "-nodes",
    "-subj",
    "/CN=localhost",
  ]);

  return { tmpDir, keyPath, certPath };
}

describe("createServer", () => {
  it("returns an HTTP server when useHttps is false", () => {
    const app = createTestExpressApp();
    const server = createServer(app, {
      useHttps: false,
      certKeyPath: "",
      certPath: "",
    });
    expect(server).not.toBeInstanceOf(https.Server);
  });

  it("returns an HTTPS server when useHttps is true and certs exist", () => {
    const { tmpDir, keyPath, certPath } = createTempCerts();
    try {
      const app = createTestExpressApp();
      const server = createServer(app, {
        useHttps: true,
        certKeyPath: keyPath,
        certPath: certPath,
      });
      expect(server).toBeInstanceOf(https.Server);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("throws when useHttps is true but cert files are missing", () => {
    const app = createTestExpressApp();
    expect(() =>
      createServer(app, {
        useHttps: true,
        certKeyPath: "/nonexistent/server.key",
        certPath: "/nonexistent/server.crt",
      }),
    ).toThrow();
  });
});
