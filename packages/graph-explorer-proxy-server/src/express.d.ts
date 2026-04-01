import type { EnvironmentValues } from "./env.js";
import type { AppLogger } from "./logging.js";

declare module "express-serve-static-core" {
  interface Application {
    locals: {
      env: EnvironmentValues;
      logger: AppLogger;
    } & Record<string, unknown>;
  }
}
