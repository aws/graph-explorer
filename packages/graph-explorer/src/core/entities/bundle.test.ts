import { describe, it, expect } from "vitest";
import { createResultBundle, getDisplayValueForBundle } from "./bundle";
import { createResultScalar } from "./scalar";
import { MISSING_DISPLAY_VALUE, NBSP } from "@/utils/constants";
import { createResultEdge, createResultVertex } from "./createEntities";

describe("getDisplayValueForBundle", () => {
  it("should format scalar values with names", () => {
    const bundle = createResultBundle({
      name: "UserInfo",
      values: [
        createResultScalar({ value: "John", name: "Name" }),
        createResultScalar({ value: 25, name: "Age" }),
        createResultScalar({ value: true, name: "Active" }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe(`Name: John${NBSP}• Age: 25${NBSP}• Active: true`);
  });

  it("should format scalar values without names", () => {
    const bundle = createResultBundle({
      values: [
        createResultScalar({ value: "John" }),
        createResultScalar({ value: 25 }),
        createResultScalar({ value: false }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe(`John${NBSP}• 25${NBSP}• false`);
  });

  it("should format null scalar values", () => {
    const bundle = createResultBundle({
      values: [
        createResultScalar({ value: null, name: "EmptyField" }),
        createResultScalar({ value: null }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe(
      `EmptyField: ${MISSING_DISPLAY_VALUE}${NBSP}• ${MISSING_DISPLAY_VALUE}`
    );
  });

  it("should format date scalar values", () => {
    const testDate = new Date("2023-12-25T10:30:00Z");
    const bundle = createResultBundle({
      values: [
        createResultScalar({ value: testDate, name: "CreatedAt" }),
        createResultScalar({ value: testDate }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);
    const expectedDateFormat = "Dec 25 2023, 10:30 AM";

    expect(result).toBe(
      `CreatedAt: ${expectedDateFormat}${NBSP}• ${expectedDateFormat}`
    );
  });

  it("should format vertex values with names", () => {
    const bundle = createResultBundle({
      values: [
        createResultVertex({
          name: "User",
          id: "v123",
          types: ["Person"],
        }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("User: v(v123)");
  });

  it("should format vertex values without names", () => {
    const bundle = createResultBundle({
      values: [
        createResultVertex({
          id: "v456",
          types: ["Person"],
        }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("v(v456)");
  });

  it("should format edge values with names", () => {
    const bundle = createResultBundle({
      values: [
        createResultEdge({
          name: "Relationship",
          id: "e789",
          type: "KNOWS",
          sourceId: "v1",
          targetId: "v2",
        }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("Relationship: e(e789)");
  });

  it("should format edge values without names", () => {
    const bundle = createResultBundle({
      values: [
        createResultEdge({
          id: "e101",
          type: "KNOWS",
          sourceId: "v1",
          targetId: "v2",
        }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("e(e101)");
  });

  it("should format nested bundle values with names", () => {
    const bundle = createResultBundle({
      values: [
        createResultBundle({
          name: "Container" as const,
          values: [
            createResultBundle({
              name: "NestedData",
              values: [createResultScalar({ value: "test" })],
            }),
          ],
        }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("Container: [...]");
  });

  it("should format nested bundle values without names", () => {
    const nestedBundle = createResultBundle({
      values: [createResultScalar({ value: "test" })],
    });

    const bundle = createResultBundle({
      values: [
        {
          entityType: "bundle" as const,
          values: [nestedBundle],
        },
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("[...]");
  });

  it("should format mixed entity types", () => {
    const bundle = createResultBundle({
      name: "MixedData",
      values: [
        createResultScalar({ value: "John", name: "Name" }),
        createResultVertex({
          name: "Profile",
          id: "v123",
          types: ["Person"],
        }),
        createResultEdge({
          name: "Connection",
          id: "e456",
          type: "KNOWS",
          sourceId: "v1",
          targetId: "v2",
        }),
        createResultBundle({
          name: "SubBundle",
          values: [createResultScalar({ value: "test" })],
        }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe(
      `Name: John${NBSP}• Profile: v(v123)${NBSP}• Connection: e(e456)${NBSP}• SubBundle: [...]`
    );
  });

  it("should handle empty bundle", () => {
    const bundle = createResultBundle({
      values: [],
    });

    const result = getDisplayValueForBundle(bundle);

    expect(result).toBe("");
  });

  it("should format numbers with locale formatting", () => {
    const bundle = createResultBundle({
      values: [
        createResultScalar({ value: 1234.56, name: "Price" }),
        createResultScalar({ value: 1000000, name: "Population" }),
      ],
    });

    const result = getDisplayValueForBundle(bundle);
    const expectedPrice = new Intl.NumberFormat().format(1234.56);
    const expectedPopulation = new Intl.NumberFormat().format(1000000);

    expect(result).toBe(
      `Price: ${expectedPrice}${NBSP}• Population: ${expectedPopulation}`
    );
  });
});
