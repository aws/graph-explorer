import { vi } from "vitest";

import { renderHookWithJotai } from "@/utils/testing";

import {
  useEntityCountFormatterCallback,
  useFormattedEntityCounts,
} from "./useEntityCountFormatter";

// Mock useTranslations
vi.mock("./useTranslations", () => ({
  default: () => (key: string) => {
    const translations: Record<string, string> = {
      node: "node",
      nodes: "nodes",
      edge: "edge",
      edges: "edges",
    };
    return translations[key] || key;
  },
}));

describe("useFormattedEntityCounts", () => {
  it("should format single node and single edge", () => {
    const { result } = renderHookWithJotai(() =>
      useFormattedEntityCounts(1, 1),
    );
    expect(result.current).toBe("1 node and 1 edge");
  });

  it("should format multiple nodes and multiple edges", () => {
    const { result } = renderHookWithJotai(() =>
      useFormattedEntityCounts(5, 3),
    );
    expect(result.current).toBe("5 nodes and 3 edges");
  });

  it("should format only nodes when edge count is zero", () => {
    const { result } = renderHookWithJotai(() =>
      useFormattedEntityCounts(2, 0),
    );
    expect(result.current).toBe("2 nodes");
  });

  it("should format only edges when node count is zero", () => {
    const { result } = renderHookWithJotai(() =>
      useFormattedEntityCounts(0, 4),
    );
    expect(result.current).toBe("4 edges");
  });

  it("should return empty string when both counts are zero", () => {
    const { result } = renderHookWithJotai(() =>
      useFormattedEntityCounts(0, 0),
    );
    expect(result.current).toBe("");
  });

  it("should format large numbers with locale formatting", () => {
    const { result } = renderHookWithJotai(() =>
      useFormattedEntityCounts(1000, 2500),
    );
    expect(result.current).toBe("1,000 nodes and 2,500 edges");
  });
});

describe("useEntityCountFormatterCallback", () => {
  it("should return a function that formats counts", () => {
    const { result } = renderHookWithJotai(() =>
      useEntityCountFormatterCallback(),
    );

    expect(typeof result.current).toBe("function");
    expect(result.current(1, 1)).toBe("1 node and 1 edge");
  });

  it("should handle different count combinations", () => {
    const { result } = renderHookWithJotai(() =>
      useEntityCountFormatterCallback(),
    );

    const format = result.current;

    expect(format(0, 0)).toBe("");
    expect(format(1, 0)).toBe("1 node");
    expect(format(0, 1)).toBe("1 edge");
    expect(format(10, 5)).toBe("10 nodes and 5 edges");
  });
});
