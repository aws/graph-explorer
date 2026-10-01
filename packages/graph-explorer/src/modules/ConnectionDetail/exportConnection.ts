import { toast } from "sonner";

import type { ConfigurationContextProps } from "@/core";

import { normalizeUrl } from "@/connections";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";

/**
 * Exports a connection to a file, surfacing a toast when the connection has no
 * usable URL or the file cannot be written, such as when a misconfigured
 * reverse proxy hides the proxy server URL the file records. A URL-less config
 * produces a file that fails its own import validation, so the export is
 * refused with feedback rather than silently writing a broken file. Returns
 * whether the file was written, so callers that chain a destructive action
 * (e.g. save-a-copy-then-delete) can skip it when the copy was refused.
 */
export function exportConnectionWithFeedback(
  config: ConfigurationContextProps,
): boolean {
  if (!normalizeUrl(config.connection?.graphDbUrl)) {
    toast.error("Cannot Export Connection", {
      description: "This connection has no URL to export",
    });
    return false;
  }

  try {
    saveConfigurationToFile(config);
  } catch (error) {
    logger.error("Export connection failed", error);
    toast.error("Cannot Export Connection", {
      description: createDisplayError(error).message,
    });
    return false;
  }
  return true;
}
