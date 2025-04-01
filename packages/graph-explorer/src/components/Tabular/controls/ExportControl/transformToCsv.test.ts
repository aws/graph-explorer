import dedent from "dedent";
import { transformToCsv } from "./transformToCsv";
import { TabularColumnInstance } from "../../helpers/tableInstanceToTabularInstance";

describe("transformToCsv", () => {
  it("should transform empty data to empty csv", () => {
    const result = transformToCsv([], []);
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

  it("should handle data with commas", () => {
    const result = transformToCsv(
      [
        {
          name: "LastName, FirstName",
          age: 10,
        },
      ],
      [createColumn("name"), createColumn("age")]
    );
    expect(csv(result)).toEqual(
      csv(`
        name,age
        "LastName, FirstName",10
      `)
    );
  });

  it("should transform data to csv and only include provided columns", () => {
    const result = transformToCsv(
      [
        {
          id: "1",
          name: "test",
          age: 10,
          gender: "male",
        },
      ],
      [createColumn("name"), createColumn("age")]
    );
    expect(csv(result)).toEqual(
      csv(`
        name,age
        test,10
      `)
    );
  });

  it("should ignore missing properties in data", () => {
    const result = transformToCsv(
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
      ]
    );
    expect(csv(result)).toEqual(
      csv(`
        id,name,age,gender
        1,test,10,male
        2,other test,,female
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
});

function createColumn<T extends object>(
  key: keyof T
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

/** Removes leading space evenly across all lines, removes empty lines, and normalizes line endings. */
function csv(value: string) {
  return dedent(value)
    .replace(/^\s*\n/gm, "")
    .replace(/\r\n|\r|\n/g, "\n");
}
