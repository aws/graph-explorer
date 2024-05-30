import { renderHook } from "@testing-library/react";
import useKeywordSearch from "./useKeywordSearch";
import { AttributeConfig, useConfiguration } from "../../core";

jest.mock("./useKeywordSearchQuery", () => ({
  useKeywordSearchQuery: jest.fn().mockReturnValue({
    data: {},
    isFetching: false,
  }),
}));

jest.mock("../../core", () => ({
  useConfiguration: jest.fn(),
}));

describe("useKeywordSearch", () => {
  describe("Gremlin", () => {
    beforeEach(() => {
      (useConfiguration as jest.Mock).mockReturnValue({
        vertexTypes: [],
        getEdgeTypeConfig: jest.fn(),
        getVertexTypeConfig: jest.fn(),
        connection: { queryEngine: "gremlin" },
      });
    });

    it("Should default to precision match exact", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedAttribute).toBe("__id");
    });

    it("Should default to node type All", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
        { value: "__id", label: "ID" },
      ]);
    });
  });

  describe("OpenCypher", () => {
    beforeEach(() => {
      (useConfiguration as jest.Mock).mockReturnValue({
        vertexTypes: [],
        getEdgeTypeConfig: jest.fn(),
        getVertexTypeConfig: jest.fn(),
        connection: { queryEngine: "openCypher" },
      });
    });

    it("Should default to precision match exact", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedAttribute).toBe("__id");
    });

    it("Should default to node type All", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
        { value: "__id", label: "ID" },
      ]);
    });
  });

  describe("SPARQL", () => {
    beforeEach(() => {
      (useConfiguration as jest.Mock).mockReturnValue({
        schema: { vertices: [{ type: "Foo" }] },
        vertexTypes: ["Foo"],
        getEdgeTypeConfig: jest.fn(),
        getVertexTypeConfig: jest.fn(),
        getVertexTypeSearchableAttributes: jest.fn().mockReturnValue([
          {
            name: "rdfs:label",
            displayLabel: "rdfs:label",
          } as AttributeConfig,
        ]),
        connection: { queryEngine: "sparql" },
      });
    });

    it("Should default to precision match exact", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute rdfs:label", async () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedAttribute).toBe("rdfs:label");
    });

    it("Should default to node type All", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
        { value: "rdfs:label", label: "rdfs:label" },
      ]);
    });
  });

  describe("SPARQL without rdfs:label", () => {
    beforeEach(() => {
      (useConfiguration as jest.Mock).mockReturnValue({
        schema: { vertices: [{ type: "Foo" }] },
        vertexTypes: ["Foo"],
        getEdgeTypeConfig: jest.fn(),
        getVertexTypeConfig: jest.fn(),
        getVertexTypeSearchableAttributes: jest.fn().mockReturnValue([]),
        connection: { queryEngine: "sparql" },
      });
    });

    it("Should default to precision match exact", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute All", async () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedAttribute).toBe("__all");
    });

    it("Should default to node type All", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHook(() => useKeywordSearch({ isOpen: false }));

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
      ]);
    });
  });
});
