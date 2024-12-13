import { env } from "@/utils";
import type { RawConfiguration } from "./types";

async function fetchConfiguration(
  configUrl: string
): Promise<RawConfiguration | undefined> {
  if (!configUrl) {
    return;
  }

  try {
    const response = await fetch(configUrl);
    const rawData = await response.json();
    return rawData as RawConfiguration;
  } catch (e) {
    if (env.DEV) {
      console.error(e);
    }
  }
}

export default fetchConfiguration;
