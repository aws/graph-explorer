// @vitest-environment happy-dom
import type { QueryEngine } from "@shared/types";

import { vi } from "vitest";

import {
  activeConfigurationAtom,
  type AppStore,
  configurationAtom,
  schemaAtom,
} from "@/core";
import { SEARCH_TOKENS } from "@/utils";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  renderHookWithJotai,
} from "@/utils/testing";

import useKeywordSearch from "./useKeywordSearch";

vi.mock("./useKeywordSearchQuery", () => ({
  useKeywordSearchQuery: vi.fn().mockReturnValue({
    data: {},
    isFetching: false,
  }),
}));

function initializeConfigWithQueryEngine(queryEngine: QueryEngine) {
  return async (store: AppStore) => {
    // Create config and setup schema
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;

    await store.set(configurationAtom, new Map([[config.id, config]]));

    // Make config active
    await store.set(activeConfigurationAtom, config.id);
  };
}

describe("useKeywordSearch", () => {
  describe("Gremlin", () => {
    it("Should default to precision match exact", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute ID", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.selectedAttribute).toBe(SEARCH_TOKENS.NODE_ID);
    });

    it("Should default to node type All", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: SEARCH_TOKENS.ALL_ATTRIBUTES, label: "All string properties" },
        { value: SEARCH_TOKENS.NODE_ID, label: "ID" },
      ]);
    });
  });

  describe("OpenCypher", () => {
    it("Should default to precision match exact", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute ID", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.selectedAttribute).toBe(SEARCH_TOKENS.NODE_ID);
    });

    it("Should default to node type All", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: SEARCH_TOKENS.ALL_ATTRIBUTES, label: "All string properties" },
        { value: SEARCH_TOKENS.NODE_ID, label: "ID" },
      ]);
    });
  });

  describe("SPARQL", () => {
    async function initializeConfigWithRdfLabel(store: AppStore) {
      // Create config and setup schema
      const config = createRandomRawConfiguration();
      const schema = createRandomSchema();
      config.connection!.queryEngine = "sparql";
      schema.vertices[0].attributes.push({
        name: "rdfs:label",
        dataType: "String",
      });

      await store.set(configurationAtom, new Map([[config.id, config]]));
      await store.set(schemaAtom, new Map([[config.id, schema]]));

      // Make config active
      await store.set(activeConfigurationAtom, config.id);
    }

    it("Should default to precision match exact", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute rdfs:label", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.selectedAttribute).toBe("rdfs:label");
    });

    it("Should default to node type All", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.attributesOptions).toStrictEqual([
        {
          value: SEARCH_TOKENS.ALL_ATTRIBUTES,
          label: "All string datatype properties",
        },
        { value: "rdfs:label", label: "rdfs:label" },
      ]);
    });
  });

  describe("SPARQL without rdfs:label", () => {
    it("Should default to precision match exact", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute All", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.selectedAttribute).toBe(
        SEARCH_TOKENS.ALL_ATTRIBUTES,
      );
    });

    it("Should default to node type All", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", async () => {
      const { result } = await renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.attributesOptions).toStrictEqual([
        {
          value: SEARCH_TOKENS.ALL_ATTRIBUTES,
          label: "All string datatype properties",
        },
      ]);
    });
  });
});
