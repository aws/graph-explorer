// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  test("styles the invalid state", () => {
    render(<Checkbox aria-label="Accept" aria-invalid />);

    expect(screen.getByRole("checkbox", { name: "Accept" })).toHaveClass(
      "aria-invalid:data-unchecked:border-danger",
      "aria-invalid:ring-3",
      "aria-invalid:ring-danger/20",
      "focus-visible:focus-ring",
    );
  });

  test("marks the checked state for the data-checked variant", () => {
    render(<Checkbox aria-label="Accept" checked />);

    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(checkbox).toHaveClass("data-unchecked:bg-background");
    expect(checkbox.querySelector("svg.lucide-check")).toHaveClass(
      "group-data-checked:flex",
    );
  });

  test("draws the shared focus ring", () => {
    render(<Checkbox aria-label="Accept" />);

    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    expect(checkbox).toHaveClass("focus-visible:focus-ring");
  });

  test("turns the focus edge white when checked", () => {
    render(<Checkbox aria-label="Accept" checked />);

    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    expect(checkbox).toHaveClass(
      "data-checked:focus-visible:outline-background",
    );
  });

  test("turns the focus edge white when indeterminate", () => {
    render(<Checkbox aria-label="Accept" checked="indeterminate" />);

    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    expect(checkbox).toHaveAttribute("data-state", "indeterminate");
    expect(checkbox).toHaveClass(
      "data-[state=indeterminate]:focus-visible:outline-background",
    );
  });
});
