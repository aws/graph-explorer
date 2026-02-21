import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import type { DisplayConfigAttribute } from "@/core";

import { PropertiesDetails } from "./Details";

vi.mock("@/hooks", async () => {
  const actual = await vi.importActual("@/hooks");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

function createAttribute(
  overrides: Partial<DisplayConfigAttribute> = {},
): DisplayConfigAttribute {
  return {
    name: "attr-name",
    displayLabel: "Attr Name",
    dataType: "String",
    isSearchable: true,
    ...overrides,
  };
}

describe("PropertiesDetails", () => {
  test("renders empty state when attributes is empty", () => {
    render(<PropertiesDetails attributes={[]} />);

    expect(screen.getByText("No properties")).toBeInTheDocument();
    expect(
      screen.getByText("This item has no properties."),
    ).toBeInTheDocument();
  });

  test("renders attribute list when attributes are provided", () => {
    const attributes = [
      createAttribute({
        name: "name",
        displayLabel: "Name",
        dataType: "String",
      }),
      createAttribute({
        name: "age",
        displayLabel: "Age",
        dataType: "Integer",
      }),
    ];

    render(<PropertiesDetails attributes={attributes} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Integer")).toBeInTheDocument();
  });

  test("renders the attribute count", () => {
    const attributes = [
      createAttribute({ name: "a" }),
      createAttribute({ name: "b" }),
      createAttribute({ name: "c" }),
    ];

    render(<PropertiesDetails attributes={attributes} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("renders description text", () => {
    render(<PropertiesDetails attributes={[]} />);

    expect(
      screen.getByText(
        /properties and their data types, which are inferred from query responses/i,
      ),
    ).toBeInTheDocument();
  });
});
