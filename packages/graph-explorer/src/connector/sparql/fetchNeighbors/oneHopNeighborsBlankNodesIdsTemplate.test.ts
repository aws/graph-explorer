import { describe, expect, it } from "vite-plus/test";

import { createVertexId } from "@/core";
import { query } from "@/utils";
import {
  normalize as normalizeCollapsed,
  normalizeWithNewlines as normalize,
} from "@/utils/testing";

import oneHopNeighborsBlankNodesIdsTemplate from "./oneHopNeighborsBlankNodesIdsTemplate";

describe("oneHopNeighborsBlankNodesIdsTemplate", () => {
  it("should wrap the neighbor sub-query and select only blank nodes", () => {
    const template = oneHopNeighborsBlankNodesIdsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      limit: 10,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT (?neighbor AS ?bNode) {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
            LIMIT 10
          }
          FILTER(isBlank(?neighbor))
        }
      `),
    );
  });

  it("should conjoin multiple attribute filters as adjacent FILTER EXISTS blocks", () => {
    const template = oneHopNeighborsBlankNodesIdsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/teamName",
          value: "Arsenal",
        },
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Gunners",
        },
      ],
    });

    expect(normalizeCollapsed(template)).toContain(
      normalizeCollapsed(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/teamName> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Arsenal")))
        }
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Gunners")))
        }
      `),
    );
    expect(template).not.toContain("?pValue");
  });

  it("emits the exact query text with every option", () => {
    const template = oneHopNeighborsBlankNodesIdsTemplate({
      resourceURI: createVertexId("http://e/r"),
      subjectClasses: ["http://e/T"],
      attributeFilters: [
        { name: "http://e/name", value: 'Ar"s' },
        { name: "http://e/nick", value: "Gun" },
      ],
      excludedVertices: new Set([
        createVertexId("http://e/x1"),
        createVertexId("http://e/x2"),
      ]),
      limit: 2,
    });

    expect(template).toBe(
      [
        "SELECT DISTINCT (?neighbor AS ?bNode) {",
        "  {",
        "    # This sub-query will give us all unique neighbors within the given limit",
        "    SELECT DISTINCT ?neighbor",
        "    WHERE {",
        "      BIND(<http://e/r> AS ?resource)",
        "      {",
        "        # Incoming neighbors",
        "        ?neighbor ?predicate ?resource .",
        "        OPTIONAL { ?neighbor a ?class } .",
        "        FILTER(",
        "          !isLiteral(?neighbor) &&",
        "          ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&",
        "          ?neighbor NOT IN (",
        "            <http://e/x1>,",
        "            <http://e/x2>",
        "          )",
        "        )",
        "        FILTER (?class IN (<http://e/T>))",
        "      }",
        "      UNION",
        "      {",
        "        # Outgoing neighbors",
        "        ?resource ?predicate ?neighbor .",
        "        OPTIONAL { ?neighbor a ?class } .",
        "        FILTER(",
        "          !isLiteral(?neighbor) &&",
        "          ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&",
        "          ?neighbor NOT IN (",
        "            <http://e/x1>,",
        "            <http://e/x2>",
        "          )",
        "        )",
        "        FILTER (?class IN (<http://e/T>))",
        "      }",
        "      FILTER EXISTS {",
        "        ?neighbor <http://e/name> ?filterValue .",
        '        FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Ar\\"s")))',
        "      }",
        "      FILTER EXISTS {",
        "        ?neighbor <http://e/nick> ?filterValue .",
        '        FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Gun")))',
        "      }",
        "    }",
        "    LIMIT 2",
        "  }",
        "  FILTER(isBlank(?neighbor))",
        "}",
      ].join("\n"),
    );
  });
});
