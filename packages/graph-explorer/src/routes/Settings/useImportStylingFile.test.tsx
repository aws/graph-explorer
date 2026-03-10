import { act } from "@testing-library/react";
import { toast } from "sonner";

import { defaultStylingAtom, getAppStore, userStylingAtom } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import { useImportStylingFile } from "./useImportStylingFile";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useImportStylingFile", () => {
  it("should import valid styling file and update default reference", async () => {
    const state = new DbState();
    state.activeStyling = {};
    const { result } = renderHookWithState(() => useImportStylingFile(), state);

    const validStyling = {
      vertices: { User: { color: "#1565C0" } },
      edges: { OWNS: { lineColor: "#2E7D32" } },
    };

    const file = new File([JSON.stringify(validStyling)], "styling.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const store = getAppStore();
    const styling = store.get(userStylingAtom);
    expect(styling.vertices?.find(v => v.type === "User")?.color).toBe(
      "#1565C0",
    );
    expect(styling.edges?.find(e => e.type === "OWNS")?.lineColor).toBe(
      "#2E7D32",
    );

    // defaultStylingAtom should be updated so reset works
    const defaults = store.get(defaultStylingAtom);
    expect(defaults?.vertices?.find(v => v.type === "User")?.color).toBe(
      "#1565C0",
    );

    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error for invalid styling file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(() => useImportStylingFile(), state);

    const invalidStyling = { vertices: "not-an-object" };
    const file = new File([JSON.stringify(invalidStyling)], "bad.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    expect(toast.error).toHaveBeenCalledWith("Invalid File", expect.anything());
  });

  it("should show error for non-JSON file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(() => useImportStylingFile(), state);

    const file = new File(["not json"], "bad.txt", {
      type: "text/plain",
    });

    await act(async () => {
      await result.current(file);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Import Failed",
      expect.anything(),
    );
  });

  it("should resolve lucide icon names during import", async () => {
    const state = new DbState();
    state.activeStyling = {};
    const { result } = renderHookWithState(() => useImportStylingFile(), state);

    const styling = {
      vertices: { User: { icon: "user", color: "#1565C0" } },
    };

    const file = new File([JSON.stringify(styling)], "styling.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const store = getAppStore();
    const imported = store.get(userStylingAtom);
    expect(imported.vertices?.find(v => v.type === "User")?.iconUrl).toMatch(
      /^data:image\/svg\+xml;base64,/,
    );
  });

  it("should import empty styling file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(() => useImportStylingFile(), state);

    const file = new File([JSON.stringify({})], "empty.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    expect(toast.success).toHaveBeenCalled();
  });
});
