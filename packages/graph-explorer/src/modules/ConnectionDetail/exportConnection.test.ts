import * as fileSaver from "file-saver";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import type { ConfigurationContextProps } from "@/core";

import { createRandomRawConfiguration } from "@/utils/testing/randomData";

import { exportConnectionWithFeedback } from "./exportConnection";

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const saveAsMock = vi.mocked(fileSaver.saveAs);
const toastErrorMock = vi.mocked(toast.error);

function makeConfig(
  connection: ConfigurationContextProps["connection"],
): ConfigurationContextProps {
  return {
    ...createRandomRawConfiguration(),
    connection,
    schema: { vertices: [], edges: [] },
    totalVertices: 0,
    vertexTypes: [],
    totalEdges: 0,
    edgeTypes: [],
  };
}

describe("exportConnectionWithFeedback", () => {
  it("exports a connection that has a url and reports success", () => {
    const exported = exportConnectionWithFeedback(
      makeConfig({ url: "https://example.com", queryEngine: "gremlin" }),
    );

    expect(exported).toBe(true);
    expect(saveAsMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("reports failure and does not export when the url is only whitespace", () => {
    const exported = exportConnectionWithFeedback(
      makeConfig({ url: "  \r\n  ", queryEngine: "gremlin" }),
    );

    expect(exported).toBe(false);
    expect(saveAsMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });

  it("reports failure and does not export when there is no connection", () => {
    const exported = exportConnectionWithFeedback(makeConfig(undefined));

    expect(exported).toBe(false);
    expect(saveAsMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });
});
