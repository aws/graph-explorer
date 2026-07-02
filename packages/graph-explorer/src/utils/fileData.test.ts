// @vitest-environment happy-dom
import {
  fromFileToJson,
  saveFile,
  toCsvFileData,
  toJsonFileData,
} from "./fileData";

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

describe("saveFile", () => {
  test("labels the save picker's file type with the given description", async () => {
    const write = vi.fn();
    const close = vi.fn();
    const createWritable = vi.fn().mockResolvedValue({ write, close });
    const showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable });
    vi.stubGlobal("showSaveFilePicker", showSaveFilePicker);

    await saveFile(toJsonFileData({}), "example.styles.json", "Example styles");

    expect(showSaveFilePicker).toHaveBeenCalledWith({
      suggestedName: "example.styles.json",
      types: [
        {
          description: "Example styles",
          accept: { "application/json": [".json"] },
        },
      ],
    });
  });

  test("defaults the description to JSON when none is given", async () => {
    const createWritable = vi
      .fn()
      .mockResolvedValue({ write: vi.fn(), close: vi.fn() });
    const showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable });
    vi.stubGlobal("showSaveFilePicker", showSaveFilePicker);

    await saveFile(toJsonFileData({}), "example.json");

    expect(showSaveFilePicker.mock.calls[0][0].types[0].description).toBe(
      "JSON",
    );
  });
});
