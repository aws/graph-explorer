// @vitest-environment happy-dom
import type { QueryEngine } from "@shared/types";

import { act } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";

import {
  activeConfigurationAtom,
  type AppStore,
  configurationAtom,
  schemaAtom,
  useSearchableAttributes,
} from "@/core";
import { SEARCH_TOKENS } from "@/utils";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  renderHookWithJotai,
} from "@/utils/testing";

import useKeywordSearch from "./useKeywordSearch";
import { useKeywordSearchQuery } from "./useKeywordSearchQuery";

vi.mock("./useKeywordSearchQuery", () => ({
  useKeywordSearchQuery: vi.fn().mockReturnValue({
    data: {},
    isFetching: false,
  }),
}));

function initializeConfigWithQueryEngine(queryEngine: QueryEngine) {
  return (store: AppStore) => {
    // Create config and setup schema
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;

    store.set(configurationAtom, new Map([[config.id, config]]));

    // Make config active
    store.set(activeConfigurationAtom, config.id);
  };
}

describe("useKeywordSearch", () => {
  describe("Gremlin", () => {
    it("Should default to precision match exact", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.selectedAttribute).toBe(SEARCH_TOKENS.NODE_ID);
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("gremlin"),
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithJotai(
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
    it("Should default to precision match exact", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.selectedAttribute).toBe(SEARCH_TOKENS.NODE_ID);
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("openCypher"),
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithJotai(
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
    function initializeConfigWithRdfLabel(store: AppStore) {
      // Create config and setup schema
      const config = createRandomRawConfiguration();
      const schema = createRandomSchema();
      config.connection!.queryEngine = "sparql";
      schema.vertices[0].attributes.push({
        name: "rdfs:label",
        dataType: "String",
      });

      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));

      // Make config active
      store.set(activeConfigurationAtom, config.id);
    }

    it("Should default to precision match exact", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute rdfs:label", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.selectedAttribute).toBe("rdfs:label");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithRdfLabel,
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithJotai(
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
    it("Should default to precision match exact", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.partialMatch).toBe(false);
    });

    it("Should default to attribute All", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.selectedAttribute).toBe(
        SEARCH_TOKENS.ALL_ATTRIBUTES,
      );
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithQueryEngine("sparql"),
      );

      expect(result.current.selectedVertexType).toBe(
        SEARCH_TOKENS.ALL_VERTEX_TYPES,
      );
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithJotai(
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

  /*
   * The all-attributes token is expanded here and never reaches a query
   * template, so these tests pin the only place the fan-out happens.
   */
  describe("all attributes token expansion", () => {
    function initializeConfigWithStringAttributes(queryEngine: QueryEngine) {
      return (store: AppStore) => {
        const config = createRandomRawConfiguration();
        const schema = createRandomSchema();
        config.connection!.queryEngine = queryEngine;
        schema.vertices[0].attributes = [
          { name: "city", dataType: "String" },
          { name: "code", dataType: "String" },
          { name: "elevation", dataType: "Number" },
        ];

        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(schemaAtom, new Map([[config.id, schema]]));
        store.set(activeConfigurationAtom, config.id);
      };
    }

    it("Should search the ID and every string attribute when all attributes is selected", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithStringAttributes("gremlin"),
      );

      act(() =>
        result.current.onAttributeOptionChange(SEARCH_TOKENS.ALL_ATTRIBUTES),
      );

      expect(vi.mocked(useKeywordSearchQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchByAttributes: [SEARCH_TOKENS.NODE_ID, "city", "code"],
        }),
      );
    });

    it("Should omit the ID for SPARQL, which cannot search by it", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithStringAttributes("sparql"),
      );

      act(() =>
        result.current.onAttributeOptionChange(SEARCH_TOKENS.ALL_ATTRIBUTES),
      );

      expect(vi.mocked(useKeywordSearchQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchByAttributes: ["city", "code"],
        }),
      );
    });

    it("Should send just the chosen attribute when one is selected", () => {
      const { result } = renderHookWithJotai(
        () => useKeywordSearch(),
        initializeConfigWithStringAttributes("gremlin"),
      );

      act(() => result.current.onAttributeOptionChange("city"));

      expect(vi.mocked(useKeywordSearchQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({ searchByAttributes: ["city"] }),
      );
    });
  });

  describe("useSearchableAttributes referential stability", () => {
    function useSearchableAttributesHarness(initialType: string) {
      const [type, setType] = useState(initialType);
      const attributes = useSearchableAttributes(type);
      return { attributes, setType };
    }

    function initializeConfigWithTwoVertexTypes(store: AppStore) {
      const config = createRandomRawConfiguration();
      const schema = createRandomSchema();
      config.connection!.queryEngine = "gremlin";
      schema.vertices[0].attributes = [
        { name: "city", dataType: "String" },
        { name: "code", dataType: "String" },
      ];
      schema.vertices[1].attributes = [{ name: "airline", dataType: "String" }];

      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);

      return {
        vertexType1: schema.vertices[0].type,
        vertexType2: schema.vertices[1].type,
      };
    }

    it("returns the same array reference across renders when the vertex type is unchanged", () => {
      let vertexType1 = "";
      const { result, rerender } = renderHookWithJotai(
        () => useSearchableAttributesHarness(vertexType1),
        store => {
          vertexType1 = initializeConfigWithTwoVertexTypes(store).vertexType1;
        },
      );

      const firstAttributes = result.current.attributes;
      rerender();

      expect(result.current.attributes).toBe(firstAttributes);
    });

    it("returns a new array reference when the vertex type changes", () => {
      let vertexType1 = "";
      let vertexType2 = "";
      const { result } = renderHookWithJotai(
        () => useSearchableAttributesHarness(vertexType1),
        store => {
          ({ vertexType1, vertexType2 } =
            initializeConfigWithTwoVertexTypes(store));
        },
      );

      const firstAttributes = result.current.attributes;
      act(() => result.current.setType(vertexType2));

      expect(result.current.attributes).not.toBe(firstAttributes);
      expect(result.current.attributes.map(attr => attr.name)).toStrictEqual([
        "airline",
      ]);
    });
  });
});
