import type { AppLogger } from "./logging.ts";

declare global {
  namespace Express {
    interface Locals {
      logger: AppLogger;
    }
  }
}
