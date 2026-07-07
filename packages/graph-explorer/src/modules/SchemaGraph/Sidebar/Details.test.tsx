import type { ReactNode } from "react";

// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import type * as Core from "@/core";

import { TooltipProvider } from "@/components";
import {
  createEdgeType,
  createVertexType,
  type DisplayConfigAttribute,
  type EdgeConnection,
} from "@/core";

import { EdgeConnectionRow, PropertiesDetails } from "./Details";

function renderWithTooltips(ui: ReactNode) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

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
    useVertexStyle: () => ({ color: "#000000" }),
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

  test("renders the unselected vertex types as buttons", () => {
    renderWithTooltips(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        onSelectionChange={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Person" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Company" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  test("does not make the selected vertex type clickable", () => {
    renderWithTooltips(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        selectedVertexType={createVertexType("Person")}
        onSelectionChange={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Person" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Company" })).toBeInTheDocument();
  });

  test("calls onSelectionChange with the source vertex when source button is clicked", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderWithTooltips(
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
    renderWithTooltips(
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
    renderWithTooltips(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        selectedVertexType={createVertexType("Person")}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "knows" }));

    expect(onSelectionChange).toHaveBeenCalledWith({
      type: "edge-connection",
      id: "Person-[knows]->Company",
    });
  });

  test("names the edge button by its label without the decorative arrows", () => {
    renderWithTooltips(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        selectedVertexType={createVertexType("Person")}
        onSelectionChange={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "knows" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /→/ })).not.toBeInTheDocument();
  });

  test("explains via tooltip that activating a type changes the selection", async () => {
    const user = userEvent.setup();
    renderWithTooltips(
      <EdgeConnectionRow
        edgeConnection={createEdgeConnection()}
        onSelectionChange={() => {}}
      />,
    );

    await user.tab();

    expect(
      await screen.findAllByText("Change selection to Person"),
    ).not.toHaveLength(0);
  });
});
