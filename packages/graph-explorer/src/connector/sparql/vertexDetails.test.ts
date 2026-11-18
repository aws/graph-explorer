import { createRandomInteger } from "@shared/utils/testing";
import { describe, expect, it, vi } from "vite-plus/test";

import { toQueryFragment } from "@/connector/queryFragment";
import { createVertexId } from "@/core";
import { query } from "@/utils";
import {
  createQuadBindingsForEntities,
  createQuadSparqlResponse,
  createTestableVertex,
  type TestableVertex,
} from "@/utils/testing";

import { UnsupportedValueTypeError } from "../queryValueError";
import { rdfTypeUri } from "./types";
import { vertexDetails } from "./vertexDetails";

describe("vertexDetails", () => {
  it("should return an empty array when no vertex IDs are provided", async () => {
    const mockFetch = vi.fn();

    const result = await vertexDetails(mockFetch, { vertexIds: [] });

    expect(result.vertices).toStrictEqual([]);
  });

  it("should return one vertex detail", async () => {
    const vertex = createTestableVertex().withRdfValues();
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(result.vertices).toStrictEqual([vertex.asVertex()]);
  });

  it("should use template with one vertex ID", async () => {
    const vertex = createTestableVertex().withRdfValues();
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(mockFetch).toHaveBeenCalledWith(
      query`
        # Get the resource attributes and class
        SELECT ?subject ?predicate ?object
        WHERE {
          VALUES ?subject { 
            <${toQueryFragment(String(vertex.id))}> 
          }
          ?subject ?predicate ?object .
          FILTER(isLiteral(?object) || ?predicate = <${toQueryFragment(rdfTypeUri)}>)
        }
      `,
    );
  });

  it("should use template with multiple vertex IDs", async () => {
    const vertices = [
      createTestableVertex().withRdfValues(),
      createTestableVertex().withRdfValues(),
    ];
    const response = createResponseFromVertices(...vertices);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await vertexDetails(mockFetch, {
      vertexIds: vertices.map(vertex => vertex.id),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      query`
        # Get the resource attributes and class
        SELECT ?subject ?predicate ?object
        WHERE {
          VALUES ?subject {
            <${toQueryFragment(String(vertices[0].id))}>
            <${toQueryFragment(String(vertices[1].id))}>
          }
          ?subject ?predicate ?object .
          FILTER(isLiteral(?object) || ?predicate = <${toQueryFragment(rdfTypeUri)}>)
        }
      `,
    );
  });

  it("should return multiple vertex details", async () => {
    const vertices = [
      createTestableVertex().withRdfValues(),
      createTestableVertex().withRdfValues(),
    ];
    const responses = createResponseFromVertices(...vertices);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(responses));

    const result = await vertexDetails(mockFetch, {
      vertexIds: vertices.map(vertex => vertex.id),
    });

    expect(result.vertices).toStrictEqual(vertices.map(v => v.asVertex()));
  });

  it("should throw an error when the vertex ID is not a string", async () => {
    const vertex = createTestableVertex().withRdfValues();
    vertex.id = createVertexId(createRandomInteger());
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(
      vertexDetails(mockFetch, { vertexIds: [vertex.id] }),
    ).rejects.toThrow(
      new UnsupportedValueTypeError("sparql", "IRI", vertex.id),
    );
  });

  it("emits the exact query text for several IDs", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ head: { vars: [] }, results: { bindings: [] } });

    await vertexDetails(mockFetch, {
      vertexIds: [createVertexId("http://e/v1"), createVertexId("http://e/v2")],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      [
        "# Get the resource attributes and class",
        "SELECT ?subject ?predicate ?object",
        "WHERE {",
        "  VALUES ?subject {",
        "    <http://e/v1>",
        "    <http://e/v2>",
        "  }",
        "  ?subject ?predicate ?object .",
        "  FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)",
        "}",
      ].join("\n"),
    );
  });
});

function createResponseFromVertices(...vertices: TestableVertex[]) {
  return createQuadSparqlResponse(createQuadBindingsForEntities(vertices, []));
}
