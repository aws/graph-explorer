import type { EnvironmentValues } from "./env.ts";
import type { AppLogger } from "./logging.ts";

declare module "express-serve-static-core" {
  interface Application {
    locals: {
      env: EnvironmentValues;
      logger: AppLogger;
    } & Record<string, unknown>;
  }
}
