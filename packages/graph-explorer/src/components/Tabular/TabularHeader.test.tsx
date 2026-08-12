// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ColumnDefinition } from "./useTabular";

import Tabular from "./Tabular";

type Row = { veryLongAttributeName: string; short: string };

const data: Row[] = [{ veryLongAttributeName: "value", short: "v" }];

function renderTable(columns: ColumnDefinition<Row>[]) {
  render(<Tabular data={data} defaultColumn={{}} columns={columns} />);
}

describe("TabularHeader", () => {
  it("truncates the header label and reveals the full name on hover", () => {
    renderTable([
      {
        id: "veryLongAttributeName",
        label: "A Very Long Attribute Name That Overflows",
        accessor: "veryLongAttributeName",
      },
    ]);

    const label = screen.getByTitle(
      "A Very Long Attribute Name That Overflows",
    );
    expect(label).toHaveTextContent(
      "A Very Long Attribute Name That Overflows",
    );
    expect(label.className).toContain("truncate");
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

    expect(screen.getByText("Custom Header")).toBeInTheDocument();
    expect(screen.queryByTitle("Short")).toBeNull();
  });
});
