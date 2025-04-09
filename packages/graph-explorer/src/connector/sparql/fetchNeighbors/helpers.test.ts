import { query } from "@/utils";
import { getFilters, getSubjectClasses } from "./helpers";
import { normalizeWithNewlines as normalize } from "@/utils/testing";

describe("getSubjectClasses", () => {
  it("should return empty string if no subject classes", () => {
    const result = getSubjectClasses([]);
    expect(result).toEqual("");
  });

  it("should create values with one class", () => {
    const result = getSubjectClasses(["http://example.org/class"]);
    expect(result).toEqual(
      `VALUES ?subjectClass { <http://example.org/class> }`
    );
  });

  it("should create values with multiple classes", () => {
    const result = getSubjectClasses([
      "http://example.org/class1",
      "http://example.org/class2",
    ]);
    expect(result).toEqual(
      `VALUES ?subjectClass { <http://example.org/class1> <http://example.org/class2> }`
    );
  });
});

describe("getFilters", () => {
  it("should return empty string if no filters", () => {
    const result = getFilters([]);
    expect(normalize(result)).toEqual("");
  });

  it("should create filter with one criteria", () => {
    const result = getFilters([
      { predicate: "http://example.org/predicate", object: "value" },
    ]);
    expect(normalize(result)).toEqual(
      normalize(query`
        FILTER (
          (?sPred=<http://example.org/predicate> && regex(str(?sValue), "value", "i"))
        )
      `)
    );
  });

  it("should create filter with multiple criteria", () => {
    const result = getFilters([
      { predicate: "http://example.org/predicate", object: "value" },
      { predicate: "http://example.org/predicate2", object: "value2" },
    ]);
    expect(normalize(result)).toEqual(
      normalize(query`
        FILTER (
          (?sPred=<http://example.org/predicate> && regex(str(?sValue), "value", "i")) ||
          (?sPred=<http://example.org/predicate2> && regex(str(?sValue), "value2", "i"))
        )
      `)
    );
  });
});
