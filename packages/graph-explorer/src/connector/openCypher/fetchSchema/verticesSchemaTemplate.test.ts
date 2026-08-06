import { UnescapableValueError } from "../../queryValueError";
import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("OpenCypher > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ type: "country" });

    expect(template).toBe("MATCH (v:`country`) RETURN v AS object LIMIT 1");
  });

  it("throws on a control-character label rather than emitting a malformed query", () => {
    expect(() => verticesSchemaTemplate({ type: "coun\ntry" })).toThrow(
      UnescapableValueError,
    );
  });
});
