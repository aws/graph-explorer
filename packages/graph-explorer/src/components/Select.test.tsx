// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

describe("Select", () => {
  test("styles the invalid trigger", () => {
    render(
      <Select value="a">
        <SelectTrigger aria-label="Service Type" aria-invalid>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Service Type" })).toHaveClass(
      "aria-invalid:border-danger",
      "aria-invalid:ring-3",
      "aria-invalid:ring-danger/20",
      "aria-invalid:focus-visible:ring-danger/50",
    );
  });
});
