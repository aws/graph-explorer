// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import type * as Core from "@/core";

import {
  createEdgeType,
  createVertexType,
  type DisplayConfigAttribute,
  type EdgeConnection,
} from "@/core";

import { EdgeConnectionRow, PropertiesDetails } from "./Details";

vi.mock("@/hooks", async () => {
  const actual = await vi.importActual("@/hooks");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/core", async () => {
  const actual = await vi.importActual<typeof Core>("@/core");
  return {
    ...actual,
    useDisplayEdgeTypeConfig: (edgeType: string) => ({
      displayLabel: edgeType,
      attributes: [],
    }),
    useDisplayVertexTypeConfig: (vertexType: string) => ({
      displayLabel: vertexType,
      attributes: [],
    }),
    useVertexPreferences: () => ({ color: "#000000" }),
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
});

describe("EdgeConnectionRow", () => {
  function createEdgeConnection(): EdgeConnection {
    return {
      sourceVertexType: createVertexType("Person"),
      edgeType: createEdgeType("knows"),
      targetVertexType: createVertexType("Company"),
    };
  }

  test("renders text without buttons when onSelectionChange is not provided", () => {
    render(<EdgeConnectionRow edgeConnection={createEdgeConnection()} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  test("renders three buttons (source, edge, target) when onSelectionChange is provided", () => {
    render(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        onSelectionChange={() => {}}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  test("calls onSelectionChange with the source vertex when source button is clicked", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Person" }));

    expect(onSelectionChange).toHaveBeenCalledWith({
      type: "vertex-type",
      id: "Person",
    });
  });

  test("calls onSelectionChange with the target vertex when target button is clicked", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Company" }));

    expect(onSelectionChange).toHaveBeenCalledWith({
      type: "vertex-type",
      id: "Company",
    });
  });

  test("calls onSelectionChange with the edge connection id when edge button is clicked", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /knows/ }));

    expect(onSelectionChange).toHaveBeenCalledWith({
      type: "edge-connection",
      id: "Person-[knows]->Company",
    });
  });
});
