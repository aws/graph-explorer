import { describe, expect, test } from "vitest";

import { createEdgeType, createVertexType } from "@/core";

import {
  createEdgeConnectionId,
  type EdgeConnectionId,
  parseEdgeConnectionId,
} from "./edgeConnectionId";

describe("edgeConnectionId", () => {
  describe("createEdgeConnectionId", () => {
    test("should create ID from edge connection", () => {
      const result = createEdgeConnectionId({
        sourceVertexType: createVertexType("Person"),
        edgeType: createEdgeType("knows"),
        targetVertexType: createVertexType("Person"),
      });

      expect(result).toBe("Person-[knows]->Person");
    });

    test("should handle different vertex types", () => {
      const result = createEdgeConnectionId({
        sourceVertexType: createVertexType("User"),
        edgeType: createEdgeType("follows"),
        targetVertexType: createVertexType("Post"),
      });

      expect(result).toBe("User-[follows]->Post");
    });
  });

  describe("parseEdgeConnectionId", () => {
    test("should parse valid edge connection ID", () => {
      const result = parseEdgeConnectionId(
        "Person-[knows]->Person" as EdgeConnectionId,
      );

      expect(result).toStrictEqual({
        sourceVertexType: createVertexType("Person"),
        edgeType: createEdgeType("knows"),
        targetVertexType: createVertexType("Person"),
      });
    });

    test("should parse edge connection with special characters", () => {
      const result = parseEdgeConnectionId(
        "User_Type-[has-relation]->Post_Type" as EdgeConnectionId,
      );

      expect(result).toStrictEqual({
        sourceVertexType: createVertexType("User_Type"),
        edgeType: createEdgeType("has-relation"),
        targetVertexType: createVertexType("Post_Type"),
      });
    });

    test("should return null for invalid format", () => {
      expect(parseEdgeConnectionId("invalid" as EdgeConnectionId)).toBeNull();
      expect(
        parseEdgeConnectionId("Person-knows-Person" as EdgeConnectionId),
      ).toBeNull();
      expect(
        parseEdgeConnectionId("Person-[knows]" as EdgeConnectionId),
      ).toBeNull();
    });
  });
});
