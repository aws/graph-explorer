import * as fileSaver from "file-saver";
import { vi } from "vitest";

import type { ConfigurationContextProps } from "@/core";

import saveConfigurationToFile from "@/utils/saveConfigurationToFile";

/**
 * Exports the config and returns the text of the file it saved. The calling
 * test must mock `file-saver`.
 */
export async function exportConnectionFileText(
  config: ConfigurationContextProps,
): Promise<string> {
  saveConfigurationToFile(config);
  const [file] = vi.mocked(fileSaver.saveAs).mock.calls[0];
  if (!(file instanceof Blob)) {
    throw new Error("saveAs was not called with a Blob");
  }
  return file.text();
}
