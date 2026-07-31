import { toast } from "sonner";

import { type ConfigurationContextProps, normalizeUrl } from "@/core";
import saveConfigurationToFile from "@/utils/saveConfigurationToFile";

/**
 * Exports a connection to a file, surfacing a toast when the connection has no
 * usable URL. A URL-less config produces a file that fails its own import
 * validation, so the export is refused with feedback rather than silently
 * writing a broken file. Returns whether the file was written, so callers that
 * chain a destructive action (e.g. save-a-copy-then-delete) can skip it when
 * the copy was refused.
 */
export function exportConnectionWithFeedback(
  config: ConfigurationContextProps,
): boolean {
  if (!normalizeUrl(config.connection?.url)) {
    toast.error("Cannot Export Connection", {
      description: "This connection has no URL to export",
    });
    return false;
  }

  saveConfigurationToFile(config);
  return true;
}
