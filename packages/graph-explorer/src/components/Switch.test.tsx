// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";

import { Switch } from "./Switch";

describe("Switch", () => {
  test("styles the invalid state", () => {
    render(<Switch aria-label="Enabled" aria-invalid />);

    expect(screen.getByRole("switch", { name: "Enabled" })).toHaveClass(
      "aria-invalid:border-danger",
      "aria-invalid:ring-3",
      "aria-invalid:ring-danger/20",
      "aria-invalid:focus-visible:ring-danger/50",
    );
  });

  test("marks the checked state for the data-checked variant", () => {
    render(<Switch aria-label="Enabled" checked />);

    const control = screen.getByRole("switch", { name: "Enabled" });
    expect(control).toHaveAttribute("data-state", "checked");
    expect(control).toHaveClass("data-checked:bg-primary");
  });
});
