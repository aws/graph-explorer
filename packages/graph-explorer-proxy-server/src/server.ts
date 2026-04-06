import type express from "express";

import fs from "fs";
import http from "http";
import https from "https";

export interface CreateServerOptions {
  useHttps: boolean;
  certKeyPath: string;
  certPath: string;
}

export function createServer(
  app: express.Express,
  options: CreateServerOptions,
): http.Server {
  if (options.useHttps) {
    const sslOptions = {
      key: fs.readFileSync(options.certKeyPath),
      cert: fs.readFileSync(options.certPath),
    };
    return https.createServer(sslOptions, app);
  }
  return http.createServer(app);
}
