import { createStore } from "jotai";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  allowLoggingDbQueryAtom,
  configurationAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  diagnosticLoggingAtom,
  schemaAtom,
  showDebugActionsAtom,
  userLayoutAtom,
  userStylingAtom,
} from "./storageAtoms";
import { defaultUserLayout } from "./userLayoutDefaults";

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
    expect(userStylingAtom).toBeDefined();
    expect(userLayoutAtom).toBeDefined();
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
    expect(store.get(userStylingAtom)).toStrictEqual({});
    expect(store.get(userLayoutAtom)).toStrictEqual(defaultUserLayout);
    expect(store.get(allGraphSessionsAtom)).toStrictEqual(new Map());
    expect(store.get(showDebugActionsAtom)).toBe(false);
    expect(store.get(allowLoggingDbQueryAtom)).toBe(false);
    expect(store.get(defaultNeighborExpansionLimitEnabledAtom)).toBe(true);
    expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(10);
    expect(store.get(diagnosticLoggingAtom)).toBe(false);
  });

  it("should persist a written value on subsequent reads", () => {
    const store = createStore();

    void store.set(showDebugActionsAtom, true);
    expect(store.get(showDebugActionsAtom)).toBe(true);

    void store.set(showDebugActionsAtom, false);
    expect(store.get(showDebugActionsAtom)).toBe(false);
  });
});
