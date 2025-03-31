import dedent from "dedent";
import transformToCsv from "./transfomerToCsv";
import getNestedObjectValue from "./getNestedObjectValue";
import { TabularColumnInstance } from "../../helpers/tableInstanceToTabularInstance";
import { Row } from "react-table";

describe("transformToCsv", () => {
  it("should transform empty data to empty csv", () => {
    const result = transformToCsv([], {}, []);
    expect(result).toBe("");
  });

  it("should transform data to csv", () => {
    const result = transformToCsv(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
      ],
      createSelectedColumns(["id", "name", "age", "gender"]),
      [
        createColumn("id"),
        createColumn("name"),
        createColumn("age"),
        createColumn("gender"),
      ]
    );
    expect(csv(result)).toEqual(
      csv(`
        id,name,age,gender
        1,test,10,male
      `)
    );
  });

  it("should transform data to csv with data that contains 'original' property", () => {
    const result = transformToCsv(
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
      createSelectedColumns(["id", "name", "age", "gender"]),
      [
        createColumn("id"),
        createColumn("name"),
        createColumn("age"),
        createColumn("gender"),
      ]
    );
    expect(csv(result)).toEqual(
      csv(`
        id,name,age,gender
        1,test,10,male
      `)
    );
  });

  it("should transform data to csv with Row instances and data that contains 'original' property", () => {
    const result = transformToCsv(
      [
        createRow({
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
          original: {
            id: "1",
            name: "test",
            age: 10,
            gender: "male",
          },
        }),
      ],
      createSelectedColumns(["id", "name", "age", "gender"]),
      [
        createColumn("id"),
        createColumn("name"),
        createColumn("age"),
        createColumn("gender"),
      ]
    );
    expect(csv(result)).toEqual(
      csv(`
        id,name,age,gender
        1,test,10,male
      `)
    );
  });

  it("should use accessor function from column", () => {
    const result = transformToCsv(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
      ],
      createSelectedColumns(["id", "name", "age", "gender"]),
      [
        createColumn("id", row => row.id + "-id"),
        createColumn("name", row => row.name + "-name"),
        createColumn("age", row => row.age * 2),
        createColumn("gender", row => row.gender + "-gender"),
      ]
    );
    expect(csv(result)).toEqual(
      csv(`
        id,name,age,gender
        1-id,test-name,20,male-gender
      `)
    );
  });

  it("should transform data to csv with Row instances", () => {
    const result = transformToCsv(
      [
        createRow({
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        }),
      ],
      createSelectedColumns(["id", "name", "age", "gender"]),
      [
        createColumn("id", row => row.id + "-id"),
        createColumn("name", row => row.name + "-name"),
        createColumn("age", row => row.age * 2),
        createColumn("gender", row => row.gender + "-gender"),
      ]
    );
    expect(csv(result)).toEqual(
      csv(`
        id,name,age,gender
        1-id,test-name,20,male-gender
      `)
    );
  });
});

function createRow<T extends object>(value: T): Row<T> {
  return {
    original: value,
    index: 0,
    cells: [],
    id: "1",
    depth: 0,
  } as unknown as Row<T>;
}

function createSelectedColumns<T>(selected: Iterable<keyof T>) {
  return Object.fromEntries(
    Iterator.from(selected).map(key => [key, true])
  ) as Record<keyof T, boolean>;
}

function createColumn<T extends object>(
  key: keyof T,
  accessor?: (row: T) => string | number | undefined
): TabularColumnInstance<T> {
  return {
    instance: {
      id: key,
    },
    definition: {
      accessor: accessor ?? key,
    },
  } as any;
}

/** Removes leading space evenly across all lines, removes empty lines, and normalizes line endings. */
function csv(value: string) {
  return dedent(value)
    .replace(/^\s*\n/gm, "")
    .replace(/\r\n|\r|\n/g, "\n");
}

describe("getNestedObjectValue", () => {
  it("should return value from nested object", () => {
    const result = getNestedObjectValue(
      {
        id: "1",
        name: "test",
        age: 10,
        gender: "male",
      },
      ["id"]
    );
    expect(result).toBe("1");
  });

  it("should return value from nested object with dot notation", () => {
    const result = getNestedObjectValue(
      {
        id: "1",
        name: "test",
        other: {
          age: 10,
          gender: "male",
        },
      },
      ["other", "age"]
    );
    expect(result).toBe(10);
  });

  it("should return undefined if value is not found", () => {
    const result = getNestedObjectValue(
      {
        id: "1",
        name: "test",
        other: {
          age: 10,
          gender: "male",
        },
      },
      ["other", "city"]
    );
    expect(result).toBe(undefined);
  });
});
