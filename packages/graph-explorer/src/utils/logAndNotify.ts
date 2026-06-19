import { toast } from "sonner";

import logger from "./logger";

type ToastOptions = Parameters<typeof toast.warning>[1];

/**
 * Builds a `.catch` handler that logs a rejected promise's error and shows the
 * user a warning toast: `somePromise.catch(logAndNotify("Couldn't save."))`.
 *
 * Use this for promises the caller does not await but whose failure the user
 * should know about — most notably persistence writes that may silently fail.
 * It is the user-facing counterpart to `logAndIgnore`: both log at `warn`
 * level, but this one also surfaces the failure through a toast. The same
 * `message` is logged (alongside the error) and shown in the toast; pass
 * `options` to add a toast description or other sonner options.
 */
export function logAndNotify(message: string, options?: ToastOptions) {
  return (error: unknown) => {
    logger.warn(message, error);
    toast.warning(message, options);
  };
}
