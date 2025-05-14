import { DbState, renderHookWithJotai } from "@/utils/testing";
import { useDefaultNeighborExpansionLimit } from "./useExpandNode";
import {
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
} from "@/core";

describe("useDefaultNeighborExpansionLimit", () => {
  it("should return the app limit when defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      delete dbState.activeConfig.connection.nodeExpansionLimit;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(defaultNeighborExpansionLimitAtom, 10);
        snapshot.set(defaultNeighborExpansionLimitEnabledAtom, true);
      }
    );

    expect(result.current).toBe(10);
  });

  it("should return the connection limit when defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      dbState.activeConfig.connection.nodeExpansionLimit = 20;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      snapshot => {
        dbState.applyTo(snapshot);
      }
    );

    expect(result.current).toBe(20);
  });

  it("should return the connection limit when both app and connection limits are defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      dbState.activeConfig.connection.nodeExpansionLimit = 20;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(defaultNeighborExpansionLimitEnabledAtom, true);
        snapshot.set(defaultNeighborExpansionLimitAtom, 10);
      }
    );

    expect(result.current).toBe(20);
  });

  it("should return null when neither app nor connection limits are defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      delete dbState.activeConfig.connection.nodeExpansionLimit;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(defaultNeighborExpansionLimitEnabledAtom, false);
      }
    );

    expect(result.current).toBeNull();
  });
});
