// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";

import { renderHookWithState } from "@/utils/testing";

import { useResolvedIconUrl } from "./useResolvedIconUrl";

describe("useResolvedIconUrl", () => {
  it("returns a plain URL synchronously (no async wait)", () => {
    const url = "https://example.com/icon.svg";
    const { result } = renderHookWithState(() => useResolvedIconUrl(url));
    expect(result.current).toBe(url);
  });

  it("returns a data: URI synchronously (no async wait)", () => {
    const dataUri = "data:image/svg+xml;base64,PHN2Zy8+";
    const { result } = renderHookWithState(() => useResolvedIconUrl(dataUri));
    expect(result.current).toBe(dataUri);
  });

  it("resolves lucide:<name> to a data URI asynchronously", async () => {
    const { result } = renderHookWithState(() =>
      useResolvedIconUrl("lucide:user"),
    );

    expect(result.current).toBeUndefined();

    await waitFor(() => {
      expect(result.current).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });

  it("returns undefined for unknown lucide name", async () => {
    const { result } = renderHookWithState(() =>
      useResolvedIconUrl("lucide:not-a-real-icon-name-xyz"),
    );

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it("returns undefined for an empty iconUrl", () => {
    const { result } = renderHookWithState(() => useResolvedIconUrl(""));
    expect(result.current).toBeUndefined();
  });
});
