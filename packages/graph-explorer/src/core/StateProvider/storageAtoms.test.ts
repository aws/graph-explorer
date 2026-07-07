import { createStore } from "jotai";

import { defaultGraphViewLayout } from "./graphViewLayoutDefaults";
import { defaultSchemaViewLayout } from "./schemaViewLayoutDefaults";
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  allowLoggingDbQueryAtom,
  configurationAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  diagnosticLoggingAtom,
  userEdgeStylesAtom,
  schemaAtom,
  schemaViewLayoutAtom,
  showDebugActionsAtom,
  graphViewLayoutAtom,
  userVertexStylesAtom,
} from "./storageAtoms";

/**
 * storageAtoms.ts uses top-level await to preload IndexedDB data into Jotai
 * atoms. These tests verify that all atoms are properly initialized and
 * readable from a fresh store, which guards against circular dependency
 * regressions that would leave atoms as `undefined`.
 */
describe("storageAtoms", () => {
  it("should initialize all atoms as defined values", () => {
    expect(activeConfigurationAtom).toBeDefined();
    expect(configurationAtom).toBeDefined();
    expect(schemaAtom).toBeDefined();
    expect(userVertexStylesAtom).toBeDefined();
    expect(userEdgeStylesAtom).toBeDefined();
    expect(graphViewLayoutAtom).toBeDefined();
    expect(schemaViewLayoutAtom).toBeDefined();
    expect(allGraphSessionsAtom).toBeDefined();
    expect(showDebugActionsAtom).toBeDefined();
    expect(allowLoggingDbQueryAtom).toBeDefined();
    expect(defaultNeighborExpansionLimitEnabledAtom).toBeDefined();
    expect(defaultNeighborExpansionLimitAtom).toBeDefined();
    expect(diagnosticLoggingAtom).toBeDefined();
  });

  it("should provide correct default values from a fresh store", () => {
    const store = createStore();

    expect(store.get(activeConfigurationAtom)).toBeNull();
    expect(store.get(configurationAtom)).toStrictEqual(new Map());
    expect(store.get(schemaAtom)).toStrictEqual(new Map());
    expect(store.get(userVertexStylesAtom)).toStrictEqual(new Map());
    expect(store.get(userEdgeStylesAtom)).toStrictEqual(new Map());
    expect(store.get(graphViewLayoutAtom)).toStrictEqual(
      defaultGraphViewLayout,
    );
    expect(store.get(schemaViewLayoutAtom)).toStrictEqual(
      defaultSchemaViewLayout,
    );
    expect(store.get(allGraphSessionsAtom)).toStrictEqual(new Map());
    expect(store.get(showDebugActionsAtom)).toBe(false);
    expect(store.get(allowLoggingDbQueryAtom)).toBe(false);
    expect(store.get(defaultNeighborExpansionLimitEnabledAtom)).toBe(true);
    expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(10);
    expect(store.get(diagnosticLoggingAtom)).toBe(false);
  });

  it("should persist a written value on subsequent reads", () => {
    const store = createStore();

    store.set(showDebugActionsAtom, true);
    expect(store.get(showDebugActionsAtom)).toBe(true);

    store.set(showDebugActionsAtom, false);
    expect(store.get(showDebugActionsAtom)).toBe(false);
  });
});
