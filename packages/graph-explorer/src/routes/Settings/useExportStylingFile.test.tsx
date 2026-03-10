import { act } from "@testing-library/react";
import { toast } from "sonner";

import { createEdgeType, createVertexType } from "@/core";
import * as fileData from "@/utils/fileData";
import { DbState, renderHookWithState } from "@/utils/testing";

import { useExportStylingFile } from "./useExportStylingFile";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useExportStylingFile", () => {
  it("should export current styling as JSON file", async () => {
    const saveSpy = vi.spyOn(fileData, "saveFile").mockResolvedValue(undefined);

    const state = new DbState();
    state.activeStyling = {
      vertices: [{ type: createVertexType("User"), color: "#1565C0" }],
      edges: [{ type: createEdgeType("OWNS"), lineColor: "#2E7D32" }],
    };

    const { result } = renderHookWithState(() => useExportStylingFile(), state);

    await act(async () => {
      await result.current();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.any(Blob),
      "defaultStyling.json",
    );

    // Verify the blob content
    const blob = saveSpy.mock.calls[0][0];
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.vertices?.User).toEqual({ color: "#1565C0" });
    expect(parsed.edges?.OWNS).toEqual({ lineColor: "#2E7D32" });

    saveSpy.mockRestore();
  });

  it("should export empty styling when no customizations", async () => {
    const saveSpy = vi.spyOn(fileData, "saveFile").mockResolvedValue(undefined);

    const state = new DbState();
    state.activeStyling = {};
    const { result } = renderHookWithState(() => useExportStylingFile(), state);

    await act(async () => {
      await result.current();
    });

    expect(saveSpy).toHaveBeenCalled();

    const blob = saveSpy.mock.calls[0][0];
    const text = await blob.text();
    const parsed = JSON.parse(text);
    expect(parsed).toEqual({});

    saveSpy.mockRestore();
  });

  it("should show error toast when save fails", async () => {
    const saveSpy = vi
      .spyOn(fileData, "saveFile")
      .mockRejectedValue(new Error("Save failed"));

    const state = new DbState();
    const { result } = renderHookWithState(() => useExportStylingFile(), state);

    await act(async () => {
      await result.current();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Export Failed",
      expect.anything(),
    );

    saveSpy.mockRestore();
  });
});
