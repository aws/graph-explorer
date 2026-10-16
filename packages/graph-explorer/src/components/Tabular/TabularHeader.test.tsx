// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import type { ColumnDefinition } from "./useTabular";

import Tabular from "./Tabular";

type Row = { veryLongAttributeName: string; short: string };

const data: Row[] = [{ veryLongAttributeName: "value", short: "v" }];

function renderTable(columns: ColumnDefinition<Row>[]) {
  render(<Tabular data={data} defaultColumn={{}} columns={columns} />);
}

describe("TabularHeader", () => {
  it("shows the full header name as a tooltip", () => {
    renderTable([
      {
        id: "veryLongAttributeName",
        label: "A Very Long Attribute Name That Overflows",
        accessor: "veryLongAttributeName",
        sortable: false,
      },
    ]);

    expect(screen.getByRole("columnheader")).toHaveAttribute(
      "title",
      "A Very Long Attribute Name That Overflows",
    );
  });

  it("adds a sort hint to the tooltip on sortable columns", () => {
    renderTable([
      {
        id: "veryLongAttributeName",
        label: "A Very Long Attribute Name That Overflows",
        accessor: "veryLongAttributeName",
      },
    ]);

    expect(screen.getByRole("columnheader")).toHaveAttribute(
      "title",
      "A Very Long Attribute Name That Overflows (click to sort)",
    );
  });

  it("omits the title when the header is not a plain string", () => {
    renderTable([
      {
        id: "short",
        label: "Short",
        headerComponent: () => <span>Custom Header</span>,
        accessor: "short",
      },
    ]);

    expect(
      screen.getByRole("columnheader", { name: "Custom Header" }),
    ).not.toHaveAttribute("title");
  });
});
