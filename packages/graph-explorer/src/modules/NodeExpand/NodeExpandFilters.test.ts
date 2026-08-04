import { toAttributeFilters } from "./NodeExpandFilters";

describe("toAttributeFilters", () => {
  it("should drop the row identity", () => {
    expect(
      toAttributeFilters([{ id: 1, name: "city", value: "san" }]),
    ).toStrictEqual([{ name: "city", value: "san" }]);
  });

  it("should drop rows with a blank value, since they constrain nothing", () => {
    expect(
      toAttributeFilters([
        { id: 1, name: "city", value: "san" },
        { id: 2, name: "country", value: "" },
      ]),
    ).toStrictEqual([{ name: "city", value: "san" }]);
  });

  it("should return no filters when every row is blank", () => {
    expect(
      toAttributeFilters([
        { id: 1, name: "city", value: "" },
        { id: 2, name: "country", value: "" },
      ]),
    ).toStrictEqual([]);
  });
});
