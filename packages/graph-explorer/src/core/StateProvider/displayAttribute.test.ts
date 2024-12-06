import {
  createRandomAttributeConfig,
  createRandomVertex,
} from "@/utils/testing";
import {
  getSortedDisplayAttributes,
  mapToDisplayAttribute,
} from "./displayAttribute";
import {
  createRandomDate,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";
import { formatDate, MISSING_DISPLAY_VALUE, sanitizeText } from "@/utils";

describe("mapToDisplayAttribute", () => {
  it("should map string value", () => {
    const name = createRandomName("name");
    const value = createRandomName("value");
    const config = createRandomAttributeConfig();
    config.name = name;
    config.dataType = "string";
    const displayAttribute = mapToDisplayAttribute(
      name,
      value,
      config,
      sanitizeText
    );
    expect(displayAttribute).toEqual({
      name,
      displayLabel: config.displayLabel,
      displayValue: value,
    });
  });

  it("should map number value", () => {
    const name = createRandomName("name");
    const value = createRandomInteger();
    const config = createRandomAttributeConfig();
    config.name = name;
    config.dataType = "number";
    const displayAttribute = mapToDisplayAttribute(
      name,
      value,
      config,
      sanitizeText
    );
    expect(displayAttribute).toEqual({
      name,
      displayLabel: config.displayLabel,
      displayValue: String(value),
    });
  });

  it("should map date value", () => {
    const name = createRandomName("name");
    const value = createRandomDate();
    const config = createRandomAttributeConfig();
    config.name = name;
    config.dataType = "Date";
    const displayAttribute = mapToDisplayAttribute(
      name,
      value.toISOString(),
      config,
      sanitizeText
    );
    expect(displayAttribute).toEqual({
      name,
      displayLabel: config.displayLabel,
      displayValue: formatDate(value),
    });
  });

  it("should map when no config is provided", () => {
    const name = createRandomName("name");
    const value = createRandomName("value");
    const displayAttribute = mapToDisplayAttribute(
      name,
      value,
      null,
      sanitizeText
    );
    expect(displayAttribute).toEqual({
      name,
      displayLabel: sanitizeText(name),
      displayValue: value,
    });
  });

  it("should map null value", () => {
    const name = createRandomName("name");
    const value = null;
    const config = createRandomAttributeConfig();
    config.name = name;
    config.dataType = "string";
    const displayAttribute = mapToDisplayAttribute(
      name,
      value,
      config,
      sanitizeText
    );
    expect(displayAttribute).toEqual({
      name,
      displayLabel: config.displayLabel,
      displayValue: MISSING_DISPLAY_VALUE,
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
      sanitizeText
    );

    const expected = [
      // All the non-matched attribute config types
      ...configAttributes
        .filter(({ name }) => name !== matchedName)
        .map(config =>
          mapToDisplayAttribute(config.name, null, config, sanitizeText)
        ),
      // All the non-matched vertex attributes value values
      ...Object.entries(vertex.attributes)
        .filter(([name]) => name !== matchedName)
        .map(([name, value]) =>
          mapToDisplayAttribute(name, value, null, sanitizeText)
        ),
      // The matched attribute config type and value
      mapToDisplayAttribute(matchedName, value, matchedConfig, sanitizeText),
    ].toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(sortedDisplayAttributes).toEqual(expected);
  });
});
