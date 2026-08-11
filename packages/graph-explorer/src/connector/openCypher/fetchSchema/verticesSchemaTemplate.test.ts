import { UnescapableValueError } from "../../queryValueError";
import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("OpenCypher > verticesSchemaTemplate", () => {
  it("returns one index-scoped sample block per label, joined by UNION ALL", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });

    expect(template).toBe(
      "MATCH (v:`airport`) RETURN v AS object LIMIT 1\n" +
        "UNION ALL\n" +
        "MATCH (v:`country`) RETURN v AS object LIMIT 1",
    );
  });

  it("returns a single block for a single label", () => {
    expect(verticesSchemaTemplate({ types: ["country"] })).toBe(
      "MATCH (v:`country`) RETURN v AS object LIMIT 1",
    );
  });

  it("throws on a control-character label rather than emitting a malformed query", () => {
    expect(() => verticesSchemaTemplate({ types: ["coun\ntry"] })).toThrow(
      UnescapableValueError,
    );
  });
});
