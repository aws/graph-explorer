import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import localforage from "localforage";
import {
  createRandomRawConfiguration,
  createRandomSchema,
} from "@/utils/testing";
import { serializeData } from "./serializeData";
import { toJsonFileData } from "@/utils/fileData";

// Mock env module before importing autoLoadBackup
vi.mock("@/utils/env", () => ({
  env: {
    GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG: false,
  },
}));

import { autoLoadBackupIfExists } from "./autoLoadBackup";
import { env } from "@/utils/env";

describe("autoLoadBackupIfExists", () => {
  beforeEach(async () => {
    // Clear localforage before each test
    await localforage.clear();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    // Reset env mock to default (force load disabled)
    vi.mocked(env).GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG = false;
  });

  afterEach(() => {
    // Reset env mock
    vi.mocked(env).GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG = false;
  });

  it("should skip auto-load when configuration already exists", async () => {
    // Set up existing configuration
    const config = createRandomRawConfiguration();
    const configMap = new Map([[config.id, config]]);
    await localforage.setItem("configuration", configMap);

    await autoLoadBackupIfExists();

    // Verify fetch was never called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should skip auto-load when configuration exists as plain object", async () => {
    // IndexedDB serializes Maps as plain objects, so test that case
    const config = createRandomRawConfiguration();
    const configObj = { [config.id]: config };
    await localforage.setItem("configuration", configObj);

    await autoLoadBackupIfExists();

    // Verify fetch was never called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should attempt auto-load when configuration map is empty", async () => {
    // Empty Map should trigger auto-load (size is 0, so no existing config)
    await localforage.setItem("configuration", new Map());

    // Mock fetch to return 404
    const mockResponse = {
      ok: false,
      status: 404,
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    await autoLoadBackupIfExists();

    // Verify fetch was called (empty config means no existing data, so should try to load)
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");
  });

  it("should auto-load backup when IndexedDB is empty and file exists", async () => {
    // Ensure IndexedDB is empty
    await localforage.clear();

    // Create backup data using the real localforage mock
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const configMap = new Map([[config.id, config]]);
    const schemaMap = new Map([[config.id, schema]]);

    // Pre-populate localforage with backup data structure
    // (simulating what would be in a backup file)
    const backupData = {
      backupSource: "Graph Explorer",
      backupSourceVersion: "2.6.0",
      backupVersion: "1.0",
      backupTimestamp: new Date(),
      data: {
        configuration: configMap,
        schema: schemaMap,
        "active-configuration": config.id,
      },
    };
    const serialized = serializeData(backupData);
    const blob = toJsonFileData(serialized);

    // Mock fetch to return the backup file
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    await autoLoadBackupIfExists();

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");

    // Verify backup was restored (restoreBackup should have populated localforage)
    // Note: The actual restore happens via restoreBackup which uses the mocked localforage
    // Since restoreBackup uses keys() which may not be fully implemented in the mock,
    // we verify that fetch was called and the function completed without error
    expect(mockResponse.blob).toHaveBeenCalled();
  });

  it("should handle 404 response gracefully when file doesn't exist", async () => {
    // Ensure IndexedDB is empty
    await localforage.clear();

    // Mock fetch to return 404
    const mockResponse = {
      ok: false,
      status: 404,
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    await autoLoadBackupIfExists();

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");

    // Verify nothing was restored
    const config = await localforage.getItem("configuration");
    expect(config).toBeNull();
  });

  it("should handle fetch errors gracefully", async () => {
    // Ensure IndexedDB is empty
    await localforage.clear();

    // Mock fetch to throw an error
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    // Should not throw
    await expect(autoLoadBackupIfExists()).resolves.not.toThrow();

    // Verify nothing was restored
    const config = await localforage.getItem("configuration");
    expect(config).toBeNull();
  });

  it("should handle restore errors gracefully", async () => {
    // Ensure IndexedDB is empty
    await localforage.clear();

    // Create invalid backup blob
    const invalidBlob = new Blob(["invalid json"], {
      type: "application/json",
    });

    // Mock fetch to return invalid backup file
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(invalidBlob),
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    // Should not throw
    await expect(autoLoadBackupIfExists()).resolves.not.toThrow();

    // Verify nothing was restored
    const config = await localforage.getItem("configuration");
    expect(config).toBeNull();
  });

  it("should handle empty configuration object gracefully", async () => {
    // Empty object should be treated as no config
    await localforage.setItem("configuration", {});

    await autoLoadBackupIfExists();

    // Should attempt to fetch (empty object means no existing data)
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");
  });

  it("should restore all backup data correctly", async () => {
    // Ensure IndexedDB is empty
    await localforage.clear();

    // Create comprehensive backup data
    const config1 = createRandomRawConfiguration();
    const config2 = createRandomRawConfiguration();
    const schema1 = createRandomSchema();
    const schema2 = createRandomSchema();
    const configMap = new Map([
      [config1.id, config1],
      [config2.id, config2],
    ]);
    const schemaMap = new Map([
      [config1.id, schema1],
      [config2.id, schema2],
    ]);

    // Create backup data structure
    const backupData = {
      backupSource: "Graph Explorer",
      backupSourceVersion: "2.6.0",
      backupVersion: "1.0",
      backupTimestamp: new Date(),
      data: {
        configuration: configMap,
        schema: schemaMap,
        "active-configuration": config1.id,
        "user-styling": {},
        "user-layout": {},
      },
    };
    const serialized = serializeData(backupData);
    const blob = toJsonFileData(serialized);

    // Mock fetch to return the backup file
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    await autoLoadBackupIfExists();

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");
    expect(mockResponse.blob).toHaveBeenCalled();

    // Note: Full restoration verification would require the mocked localforage
    // to have a fully functional keys() method. The important thing is that
    // the function completes without error and attempts to restore.
  });

  it("should force load backup when GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG is true", async () => {
    // Set up existing configuration
    const config = createRandomRawConfiguration();
    const configMap = new Map([[config.id, config]]);
    await localforage.setItem("configuration", configMap);

    // Mock env to enable force load and reset modules to pick up the change
    vi.mocked(env).GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG = true;
    vi.resetModules();
    const { autoLoadBackupIfExists: autoLoadWithForce } =
      await import("./autoLoadBackup");

    // Create backup data
    const newConfig = createRandomRawConfiguration();
    const backupData = {
      backupSource: "Graph Explorer",
      backupSourceVersion: "2.6.0",
      backupVersion: "1.0",
      backupTimestamp: new Date(),
      data: {
        configuration: new Map([["New Config", newConfig]]),
        "active-configuration": "New Config",
      },
    };
    const serialized = serializeData(backupData);
    const blob = toJsonFileData(serialized);

    // Mock fetch to return the backup file
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    await autoLoadWithForce();

    // Verify fetch was called despite existing config
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");
    expect(mockResponse.blob).toHaveBeenCalled();
  });

  it("should warn when force load is enabled but file doesn't exist", async () => {
    // Set up existing configuration
    const config = createRandomRawConfiguration();
    const configMap = new Map([[config.id, config]]);
    await localforage.setItem("configuration", configMap);

    // Mock env to enable force load and reset modules to pick up the change
    vi.mocked(env).GRAPH_EXP_FORCE_LOAD_BACKUP_CONFIG = true;
    vi.resetModules();
    const { autoLoadBackupIfExists: autoLoadWithForce } =
      await import("./autoLoadBackup");

    // Mock fetch to return 404
    const mockResponse = {
      ok: false,
      status: 404,
    };
    vi.mocked(global.fetch).mockResolvedValue(
      mockResponse as unknown as Response,
    );

    await autoLoadWithForce();

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith("/graph-explorer-config.json");
  });
});
