import escapeString from "./escapeString";

describe("escapeString", () => {
  it("Should handle empty strings", () => {
    expect(escapeString(undefined)).toEqual("");
    expect(escapeString("")).toEqual("");
    expect(escapeString(" ")).toEqual(" ");
  });

  it("Should handle strings without quotes", () => {
    expect(escapeString(" te st ")).toEqual(" te st ");
    expect(escapeString("test")).toEqual("test");
    expect(escapeString("t'est")).toEqual("t'est");
  });

  it("Should handle strings with quotes", () => {
    expect(escapeString(' te"st ')).toEqual(' te\\"st ');
    expect(escapeString('"test"')).toEqual('\\"test\\"');
    expect(escapeString("\"t'est\"")).toEqual("\\\"t'est\\\"");
  });

});
