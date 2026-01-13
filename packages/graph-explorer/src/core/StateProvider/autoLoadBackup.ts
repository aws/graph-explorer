import localforage from "localforage";
import { logger } from "@/utils";
import { env } from "@/utils/env";
import { readBackupDataFromFile, restoreBackup, type LocalDb } from "./localDb";

const BACKUP_CONFIG_URL = "/graph-explorer-config.json";

/**
 * Auto-loads the backup configuration file if IndexedDB is empty.
 * This function checks if any configuration exists in IndexedDB, and if not,
 * attempts to fetch and restore the backup config file from the server.
 *
 * When GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG is set to "true", the IndexedDB
 * check is bypassed and the backup config is always loaded, ensuring the
 * mounted config file takes precedence.
 *
 * This is intended to be called before React initializes (in storageAtoms.ts)
 * to ensure the backup is loaded before atoms are created.
 *
 * Uses the existing backup/restore functionality from localDb.ts to maintain
 * consistency with the manual backup/restore feature.
 */
export async function autoLoadBackupIfExists() {
  try {
    // If force load is enabled, skip IndexedDB check and always load
    const forceLoad = env.GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG;

    if (!forceLoad) {
      // Check if we already have configuration data
      // Note: IndexedDB serializes Maps as plain objects, so we check both cases
      const existingConfigs = await localforage.getItem<
        Map<string, unknown> | Record<string, unknown>
      >("configuration");
      if (existingConfigs) {
        const configSize =
          existingConfigs instanceof Map
            ? existingConfigs.size
            : Object.keys(existingConfigs).length;
        if (configSize > 0) {
          logger.debug("Configuration already exists, skipping auto-load");
          return;
        }
      }
    } else {
      logger.debug("Force load enabled, bypassing IndexedDB check");
    }

    // Try to fetch the backup config file
    const response = await fetch(BACKUP_CONFIG_URL);
    if (!response.ok) {
      if (forceLoad) {
        logger.warn(
          "Force load enabled but backup config file not found or not accessible",
        );
      } else {
        logger.debug("No backup config file found or not accessible");
      }
      return;
    }

    // Read and restore the backup
    const blob = await response.blob();
    const backupData = await readBackupDataFromFile(blob);
    await restoreBackup(backupData, localforage as LocalDb);
    logger.log(
      forceLoad
        ? "Force-loaded backup configuration from file (overrode IndexedDB)"
        : "Auto-loaded backup configuration from file",
    );
  } catch (error) {
    logger.warn("Failed to auto-load backup configuration", error);
    // Don't throw - allow app to continue with default state
  }
}
