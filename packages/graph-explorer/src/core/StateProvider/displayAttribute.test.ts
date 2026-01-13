import {
  createRandomBoolean,
  createRandomDate,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

import { getDisplayValueForScalar } from "@/connector/entities";
import { formatDate, LABELS } from "@/utils";
import {
  createRandomAttributeConfig,
  createRandomVertex,
} from "@/utils/testing";

import {
  getSortedDisplayAttributes,
  mapToDisplayAttribute,
} from "./displayAttribute";
import { RDFS_LABEL_URI } from "./sortAttributeByName";

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

  it("should map empty string value", () => {
    const name = createRandomName("name");
    const value = "";
    const displayAttribute = mapToDisplayAttribute(name, value, transformNoOp);
    expect(displayAttribute).toStrictEqual({
      name,
      displayLabel: name,
      displayValue: LABELS.EMPTY_VALUE,
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

  it("should use the transformer for display name", () => {
    const value = createRandomName("value");
    const config = createRandomAttributeConfig();
    config.dataType = "string";
    const transform = () => "prefixed value";
    const displayAttribute = mapToDisplayAttribute(
      config.name,
      value,
      transform,
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

    const vertex = createRandomVertex();
    vertex.attributes[matchedName] = value;

    const sortedDisplayAttributes = getSortedDisplayAttributes(
      vertex,
      transformNoOp,
    );

    const expected = [
      // All the matched vertex attributes value values
      ...Object.entries(vertex.attributes)
        .filter(([name]) => name !== matchedName)
        .map(([name, value]) =>
          mapToDisplayAttribute(name, value, transformNoOp),
        ),
      // The matched attribute config type and value
      mapToDisplayAttribute(matchedName, value, transformNoOp),
    ].toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(sortedDisplayAttributes).toStrictEqual(expected);
  });

  it("should sort rdfs:label as the first attribute", () => {
    const vertex = createRandomVertex();
    vertex.attributes = {
      name: "John Doe",
      age: 30,
      [RDFS_LABEL_URI]: "Person Label",
      email: "john@example.com",
    };

    const sortedDisplayAttributes = getSortedDisplayAttributes(
      vertex,
      transformNoOp,
    );

    expect(sortedDisplayAttributes[0].name).toBe(RDFS_LABEL_URI);
    expect(sortedDisplayAttributes[0].displayValue).toBe("Person Label");
  });

  it("should sort rdfs:label first even when other attributes come alphabetically before it", () => {
    const vertex = createRandomVertex();
    vertex.attributes = {
      aaa: "value1",
      bbb: "value2",
      [RDFS_LABEL_URI]: "Label Value",
      zzz: "value3",
    };

    const sortedDisplayAttributes = getSortedDisplayAttributes(
      vertex,
      transformNoOp,
    );

    expect(sortedDisplayAttributes.map(a => a.name)).toStrictEqual([
      RDFS_LABEL_URI,
      "aaa",
      "bbb",
      "zzz",
    ]);
  });
});

/** Returns the text as is */
function transformNoOp(text: string) {
  return text;
}
