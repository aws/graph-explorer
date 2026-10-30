// @vitest-environment happy-dom

import { act } from "react";
import { describe, expect, it, vi } from "vite-plus/test";

import * as FileData from "@/utils/fileData";
import { createRandomGraphViewLayout, DbState } from "@/utils/testing";
import { renderHookWithState } from "@/utils/testing/renderHookWithJotai";

import { useExportGraph } from "./ExportGraphButton";

describe("useExportGraph", () => {
  it("writes the Graph View's chosen layout into the file", async () => {
    const saveFile = vi
      .spyOn(FileData, "saveFile")
      .mockResolvedValue(undefined);
    const dbState = new DbState().withGraphViewLayout({
      ...createRandomGraphViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(() => useExportGraph(), dbState);

    await act(() => result.current());

    const [file] = saveFile.mock.calls[0];
    const saved = JSON.parse(await file.text());
    expect(saved.data.layout).toBe("DAGRE_LR");
  });
});
