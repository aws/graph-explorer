import useKeywordSearch from "./useKeywordSearch";
import { QueryEngine } from "@shared/types";
import { createRandomSchema, renderHookWithRecoilRoot } from "@/utils/testing";
import { createRandomRawConfiguration } from "@/utils/testing";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { MutableSnapshot } from "recoil";
import { vi } from "vitest";
import { schemaAtom } from "@/core/StateProvider/schema";

vi.mock("./useKeywordSearchQuery", () => ({
  useKeywordSearchQuery: vi.fn().mockReturnValue({
    data: {},
    isFetching: false,
  }),
}));

function initializeConfigWithQueryEngine(queryEngine: QueryEngine) {
  return (snapshot: MutableSnapshot) => {
    // Create config and setup schema
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;

    snapshot.set(configurationAtom, new Map([[config.id, config]]));

    // Make config active
    snapshot.set(activeConfigurationAtom, config.id);
  };
}

describe("useKeywordSearch", () => {
  describe("Gremlin", () => {
    it("Should default to precision match exact", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.selectedAttribute).toBe("__id");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
        { value: "__id", label: "ID" },
      ]);
    });
  });

  describe("OpenCypher", () => {
    it("Should default to precision match exact", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.selectedAttribute).toBe("__id");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
        { value: "__id", label: "ID" },
      ]);
    });
  });

  describe("SPARQL", () => {
    function initializeConfigWithRdfLabel(snapshot: MutableSnapshot) {
      // Create config and setup schema
      const config = createRandomRawConfiguration();
      const schema = createRandomSchema();
      config.connection!.queryEngine = "sparql";
      schema.vertices[0].attributes.push({
        name: "rdfs:label",
        displayLabel: "rdfs:label",
        searchable: true,
        dataType: "String",
      });

      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));

      // Make config active
      snapshot.set(activeConfigurationAtom, config.id);
    }

    it("Should default to precision match exact", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute rdfs:label", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel
      );

      expect(result.current.selectedAttribute).toBe("rdfs:label");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
        { value: "rdfs:label", label: "rdfs:label" },
      ]);
    });
  });

  describe("SPARQL without rdfs:label", () => {
    it("Should default to precision match exact", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.selectedAttribute).toBe("__all");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
      ]);
    });
  });
});
