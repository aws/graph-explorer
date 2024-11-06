import { generateCssVariable } from "./lib";

describe("generateCssVariable", () => {
  it("should generate a valid css string-value for empty parameters", () => {
    const result = generateCssVariable();
    expect(result).toEqual("");
  });

  it("should generate a valid css string-value for only one parameter", () => {
    const result = generateCssVariable("--colors-primary");
    expect(result).toEqual("var(--colors-primary)");
  });

  it("should generate a valid css string-value for two parameters", () => {
    const result = generateCssVariable("--colors-primary", "blue");
    expect(result).toEqual("var(--colors-primary, blue)");
  });

  it("should generate a valid css string-value for three or more parameters", () => {
    const result = generateCssVariable(
      "--toast-info-background",
      "--colors-primary-dark",
      "--colors-primary",
      "blue"
    );
    expect(result).toEqual(
      "var(--toast-info-background, var(--colors-primary-dark, var(--colors-primary, blue)))"
    );
  });
});
