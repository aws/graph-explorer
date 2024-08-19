import {
  createRandomName,
  createRandomInteger,
  createRandomDate,
  createArray,
} from "../../utils/testing";
import { serializeData, deserializeData } from "./serializeData";

describe("serializeData", () => {
  test("serialize string", () => {
    const input = createRandomName("input");
    const result = serializeData(input);
    expect(result).toEqual(input);
  });
  test("serialize number", () => {
    const input = createRandomInteger();
    const result = serializeData(input);
    expect(result).toEqual(input);
  });
  test("serialize null", () => {
    const input = null;
    const result = serializeData(input);
    expect(result).toEqual(input);
  });
  test("serialize undefined on object", () => {
    const input = {
      undefinedValue: undefined,
    };
    const result = serializeData(input);
    expect(result).toEqual(input);
  });
  test("serialize date", () => {
    const input = createRandomDate();
    const result = serializeData(input);
    expect(result).toEqual({
      __type: "Date",
      value: input.toISOString(),
    });
  });
  test("serialize map", () => {
    const input = new Map(
      createArray(3, () => [createRandomName("key"), createRandomName("value")])
    );
    const result = serializeData(input);
    expect(result).toEqual({
      __type: "Map",
      value: Array.from(input.entries()),
    });
  });
  test("serialize set", () => {
    const input = new Set(createArray(3, () => createRandomName("value")));
    const result = serializeData(input);
    expect(result).toEqual({
      __type: "Set",
      value: Array.from(input.values()),
    });
  });
  test("serialize deep object tree", () => {
    const input = {
      mapValue: new Map([
        [
          createRandomName("key"),
          {
            mapValue: new Map([
              [
                createRandomName("key"),
                {
                  dateValue: createRandomDate(),
                  numberValue: createRandomInteger(),
                  stringValue: createRandomName("string"),
                  undefinedValue: undefined,
                  nullValue: null,
                },
              ],
            ]),
            setValue: new Set([
              {
                dateValue: createRandomDate(),
                numberValue: createRandomInteger(),
                stringValue: createRandomName("string"),
                undefinedValue: undefined,
                nullValue: null,
              },
            ]),
            dateValue: createRandomDate(),
            numberValue: createRandomInteger(),
            stringValue: createRandomName("string"),
            undefinedValue: undefined,
            nullValue: null,
          },
        ],
      ]),
      setValue: new Set([
        {
          mapValue: new Map([
            [
              createRandomName("key"),
              {
                dateValue: createRandomDate(),
                numberValue: createRandomInteger(),
                stringValue: createRandomName("string"),
                undefinedValue: undefined,
                nullValue: null,
              },
            ],
          ]),
          setValue: new Set([
            {
              dateValue: createRandomDate(),
              numberValue: createRandomInteger(),
              stringValue: createRandomName("string"),
              undefinedValue: undefined,
              nullValue: null,
            },
          ]),
          dateValue: createRandomDate(),
          numberValue: createRandomInteger(),
          stringValue: createRandomName("string"),
          undefinedValue: undefined,
          nullValue: null,
        },
      ]),
      dateValue: createRandomDate(),
      numberValue: createRandomInteger(),
      stringValue: createRandomName("string"),
      undefinedValue: undefined,
      nullValue: null,
      objectValue: {
        mapValue: new Map([
          [
            createRandomName("key"),
            {
              dateValue: createRandomDate(),
              numberValue: createRandomInteger(),
              stringValue: createRandomName("string"),
              undefinedValue: undefined,
              nullValue: null,
            },
          ],
        ]),
        setValue: new Set([
          {
            dateValue: createRandomDate(),
            numberValue: createRandomInteger(),
            stringValue: createRandomName("string"),
            undefinedValue: undefined,
            nullValue: null,
          },
        ]),
        dateValue: createRandomDate(),
        numberValue: createRandomInteger(),
        stringValue: createRandomName("string"),
        undefinedValue: undefined,
        nullValue: null,
      },
    };
    const serializedInput = serializeData(input);
    const result = deserializeData(serializedInput);
    expect(result).toEqual(input);
  });
});
