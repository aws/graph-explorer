import useKeywordSearch from "./useKeywordSearch";
import { ConnectionConfig } from "../../core";
import renderHookWithRecoilRoot from "../../utils/testing/renderHookWithRecoilRoot";
import { createRandomRawConfiguration } from "../../utils/testing/randomData";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import { MutableSnapshot } from "recoil";

jest.mock("./useKeywordSearchQuery", () => ({
  useKeywordSearchQuery: jest.fn().mockReturnValue({
    data: {},
    isFetching: false,
  }),
}));

function initializeConfigWithQueryEngine(
  queryEngine: ConnectionConfig["queryEngine"]
) {
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
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.selectedAttribute).toBe("__id");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("gremlin")
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
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
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute ID", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.selectedAttribute).toBe("__id");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("openCypher")
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
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
      config.connection!.queryEngine = "sparql";
      config.schema?.vertices[0].attributes.push({
        name: "rdfs:label",
        displayLabel: "rdfs:label",
        searchable: true,
        dataType: "String",
      });

      snapshot.set(configurationAtom, new Map([[config.id, config]]));

      // Make config active
      snapshot.set(activeConfigurationAtom, config.id);
    }

    it("Should default to precision match exact", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithRdfLabel
      );

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute rdfs:label", async () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithRdfLabel
      );

      expect(result.current.selectedAttribute).toBe("rdfs:label");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithRdfLabel
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
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
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.exactMatch).toBe(true);
    });

    it("Should default to attribute All", async () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.selectedAttribute).toBe("__all");
    });

    it("Should default to node type All", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.selectedVertexType).toBe("__all");
    });

    it("Should have all searchable attributes", () => {
      const { result } = renderHookWithRecoilRoot(
        () => useKeywordSearch({ isOpen: false }),
        initializeConfigWithQueryEngine("sparql")
      );

      expect(result.current.attributesOptions).toStrictEqual([
        { value: "__all", label: "All" },
      ]);
    });
  });
});
