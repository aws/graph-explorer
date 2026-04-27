// @vitest-environment happy-dom
import { fromFileToJson, toCsvFileData, toJsonFileData } from "./fileData";

describe("toJsonFileData", () => {
  test("should create a JSON blob", () => {
    const blob = toJsonFileData({ key: "value", num: 42 });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });
});

describe("toCsvFileData", () => {
  test("should create a CSV blob", () => {
    const blob = toCsvFileData("a,b,c\n1,2,3");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/csv;charset=utf-8");
  });
});

describe("fromFileToJson", () => {
  test("should parse JSON from a blob", async () => {
    const data = { hello: "world" };
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    const result = await fromFileToJson(blob);
    expect(result).toStrictEqual(data);
  });
});
