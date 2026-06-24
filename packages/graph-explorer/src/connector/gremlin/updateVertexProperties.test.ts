import { describe, expect, test } from "vitest";

import { createVertexId } from "@/core";

import { updateVertexPropertiesQuery } from "./updateVertexProperties";

describe("updateVertexPropertiesQuery", () => {
  test("uses the L suffix for numeric vertex ids", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId(42),
      properties: {},
    });

    expect(result).toContain("g.V(42L)");
  });

  test("quotes string vertex ids", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("notion-1"),
      properties: {},
    });

    expect(result).toContain('g.V("notion-1")');
  });

  test("produces no property steps for an empty properties map", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: {},
    });

    expect(result).toBe('g.V("v1")');
  });

  test("generates one property step per entry", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { name: "Alice", age: 30 },
    });

    expect(result).toContain('.property("name", "Alice")');
    expect(result).toContain('.property("age", 30L)');
  });

  test("quotes and escapes string values", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { label: 'say "hello"' },
    });

    expect(result).toContain('.property("label", "say \\"hello\\"")');
  });

  test("escapes backslashes in string values", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { path: "C:\\Users\\foo" },
    });

    expect(result).toContain('.property("path", "C:\\\\Users\\\\foo")');
  });

  test("serializes integer numbers with the L suffix", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { count: 7 },
    });

    expect(result).toContain('.property("count", 7L)');
  });

  test("serializes float numbers without the L suffix", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { score: 3.14 },
    });

    expect(result).toContain('.property("score", 3.14)');
    expect(result).not.toContain("3.14L");
  });

  test("serializes boolean values without quotes", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { active: true, deleted: false },
    });

    expect(result).toContain('.property("active", true)');
    expect(result).toContain('.property("deleted", false)');
  });

  test("serializes Date values as new Date(epochMs)", () => {
    const date = new Date("2024-01-15T12:00:00.000Z");
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { createdAt: date },
    });

    expect(result).toContain(
      `.property("createdAt", new Date(${String(date.getTime())}L))`,
    );
  });

  test("silently skips the reserved ~id property", () => {
    const result = updateVertexPropertiesQuery({
      vertexId: createVertexId("v1"),
      properties: { "~id": "should-be-ignored", name: "Alice" },
    });

    expect(result).not.toContain("~id");
    expect(result).toContain('.property("name", "Alice")');
  });
});
