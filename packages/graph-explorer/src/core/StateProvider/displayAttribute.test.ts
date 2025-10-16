import {
  createRandomAttributeConfig,
  createRandomVertex,
} from "@/utils/testing";
import {
  getSortedDisplayAttributes,
  mapToDisplayAttribute,
} from "./displayAttribute";
import {
  createRandomBoolean,
  createRandomDate,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";
import { formatDate, LABELS } from "@/utils";
import { getDisplayValueForScalar } from "@/connector/entities";

describe("mapToDisplayAttribute", () => {
  it("should map string value", () => {
    const name = createRandomName("name");
    const value = createRandomName("value");
    const displayAttribute = mapToDisplayAttribute(name, value, transformNoOp);
    expect(displayAttribute).toStrictEqual({
      name,
      displayLabel: name,
      displayValue: value,
    });
  });

  it("should map number value", () => {
    const name = createRandomName("name");
    const value = createRandomInteger();
    const displayAttribute = mapToDisplayAttribute(name, value, transformNoOp);
    expect(displayAttribute).toStrictEqual({
      name,
      displayLabel: name,
      displayValue: getDisplayValueForScalar(value),
    });
  });

  it("should map boolean value", () => {
    const name = createRandomName("name");
    const value = createRandomBoolean();
    const displayAttribute = mapToDisplayAttribute(name, value, transformNoOp);
    expect(displayAttribute).toStrictEqual({
      name,
      displayLabel: name,
      displayValue: String(value),
    });
  });

  it("should map date value", () => {
    const name = createRandomName("name");
    const value = createRandomDate();
    const displayAttribute = mapToDisplayAttribute(name, value, transformNoOp);
    expect(displayAttribute).toStrictEqual({
      name,
      displayLabel: name,
      displayValue: formatDate(value),
    });
  });

  it("should map null value", () => {
    const name = createRandomName("name");
    const value = null;
    const displayAttribute = mapToDisplayAttribute(name, value, transformNoOp);
    expect(displayAttribute).toStrictEqual({
      name,
      displayLabel: name,
      displayValue: LABELS.MISSING_VALUE,
    });
  });

  it("should use the transformer for display name", () => {
    const value = createRandomName("value");
    const config = createRandomAttributeConfig();
    config.dataType = "string";
    const transform = () => "prefixed value";
    const displayAttribute = mapToDisplayAttribute(
      config.name,
      value,
      transform
    );
    expect(displayAttribute).toStrictEqual({
      name: config.name,
      displayLabel: "prefixed value",
      displayValue: value,
    });
  });
});

describe("getSortedDisplayAttributes", () => {
  it("should sort display attributes by display label", () => {
    const matchedName = createRandomName("name");
    const value = createRandomName("value");

    const matchedConfig = createRandomAttributeConfig();
    matchedConfig.name = matchedName;

    const configAttributes = [
      createRandomAttributeConfig(),
      createRandomAttributeConfig(),
      matchedConfig,
    ];

    const vertex = createRandomVertex();
    vertex.attributes[matchedName] = value;

    const sortedDisplayAttributes = getSortedDisplayAttributes(
      vertex,
      configAttributes,
      transformNoOp
    );

    const expected = [
      // All the non-matched attribute config types
      ...configAttributes
        .filter(({ name }) => name !== matchedName)
        .map(config => mapToDisplayAttribute(config.name, null, transformNoOp)),
      // All the non-matched vertex attributes value values
      ...Object.entries(vertex.attributes)
        .filter(([name]) => name !== matchedName)
        .map(([name, value]) =>
          mapToDisplayAttribute(name, value, transformNoOp)
        ),
      // The matched attribute config type and value
      mapToDisplayAttribute(matchedName, value, transformNoOp),
    ].toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(sortedDisplayAttributes).toStrictEqual(expected);
  });
});

/** Returns the text as is */
function transformNoOp(text: string) {
  return text;
}
