import type { TabularColumnInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

import { transformToJson } from "./transformToJson";

import { LABELS } from "@/utils/constants";

describe("transformToJson", () => {
  it("should transform empty data to empty array", () => {
    const result = transformToJson([], []);
    expect(result).toEqual([]);
  });

  it("should transform data to json", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
      ],
      [
        createColumn("id"),
        createColumn("name"),
        createColumn("age"),
        createColumn("gender"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        name: "test",
        age: 10,
        gender: "male",
      },
    ]);
  });

  it("should handle data with commas", () => {
    const result = transformToJson(
      [
        {
          name: "LastName, FirstName",
          age: 10,
        },
      ],
      [createColumn("name"), createColumn("age")],
    );
    expect(result).toEqual([
      {
        name: "LastName, FirstName",
        age: 10,
      },
    ]);
  });

  it("should transform data to json and only include provided columns", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
      ],
      [createColumn("name"), createColumn("age")],
    );
    expect(result).toEqual([
      {
        name: "test",
        age: 10,
      },
    ]);
  });

  it("should ignore missing properties in data", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
        {
          id: "2",
          name: "other test",
          gender: "female",
        },
      ],
      [
        createColumn("id"),
        createColumn("name"),
        createColumn("age"),
        createColumn("gender"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        name: "test",
        age: 10,
        gender: "male",
      },
      {
        id: "2",
        name: "other test",
        gender: "female",
      },
    ]);
  });

  it("should transform data to json with data that contains 'original' property", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
          original: {
            idButDifferent: "1",
            nameButDifferent: "test",
            ageButDifferent: 10,
            genderButDifferent: "male",
          },
        },
      ],
      [
        createColumn("id"),
        createColumn("name"),
        createColumn("age"),
        createColumn("gender"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        name: "test",
        age: 10,
        gender: "male",
      },
    ]);
  });

  it("should handle function accessors", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
        },
      ],
      [
        createColumn("id"),
        createColumnWithFunction("fullName", row => `${row.name} (${row.id})`),
        createColumn("age"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        fullName: "test (1)",
        age: 10,
      },
    ]);
  });

  it("should handle mixed string and function accessors", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
      ],
      [
        createColumn("id"),
        createColumn("name"),
        createColumnWithFunction("ageGroup", row =>
          row.age >= 18 ? "adult" : "minor",
        ),
        createColumn("gender"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        name: "test",
        ageGroup: "minor",
        gender: "male",
      },
    ]);
  });

  it("should handle function accessors that return null or undefined", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
          age: 10,
        },
      ],
      [
        createColumn("id"),
        createColumn("name"),
        createColumnWithFunction("optional", () => null),
        createColumnWithFunction("optional2", () => undefined),
        createColumn("age"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        name: "test",
        optional: null,
        optional2: undefined,
        age: 10,
      },
    ]);
  });

  it("should handle columns with null accessor", () => {
    const result = transformToJson(
      [
        {
          id: "1",
          name: "test",
        },
      ],
      [
        createColumn("id"),
        createColumnWithAccessor("name", null),
        createColumn("name"),
      ],
    );
    expect(result).toEqual([
      {
        id: "1",
        name: "test",
      },
    ]);
  });

  it("should export placeholder values as null", () => {
    const result = transformToJson(
      [
        {
          name: LABELS.MISSING_VALUE,
        },
      ],
      [createColumn("name")],
    );

    expect(result).toEqual([
      {
        name: null,
      },
    ]);
  });

});

function createColumn<T extends object>(
  key: keyof T,
): TabularColumnInstance<T> {
  return {
    instance: {
      id: key,
    },
    definition: {
      accessor: key,
    },
  } as any;
}

function createColumnWithFunction<T extends object>(
  id: string,
  accessor: (row: T) => unknown,
): TabularColumnInstance<T> {
  return {
    instance: {
      id,
    },
    definition: {
      accessor,
    },
  } as any;
}

function createColumnWithAccessor<T extends object>(
  id: string,
  accessor: string | ((row: T) => unknown) | null,
): TabularColumnInstance<T> {
  return {
    instance: {
      id,
    },
    definition: {
      accessor: accessor as any,
    },
  } as any;
}
