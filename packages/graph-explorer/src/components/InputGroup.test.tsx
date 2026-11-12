// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vite-plus/test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./InputGroup";

describe("InputGroup", () => {
  test("focuses the input when the addon text is clicked", async () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Query" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>Hint</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    await userEvent.setup().click(screen.getByText("Hint"));

    expect(screen.getByRole("textbox", { name: "Query" })).toHaveFocus();
  });

  test("focuses the textarea when the addon text is clicked", async () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Query" />
        <InputGroupAddon align="block-end">
          <InputGroupText>Hint</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    await userEvent.setup().click(screen.getByText("Hint"));

    expect(screen.getByRole("textbox", { name: "Query" })).toHaveFocus();
  });

  test("leaves focus on a button inside the addon", async () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Query" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Run</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByRole("button", { name: "Run" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Query" })).not.toHaveFocus();
  });

  test("names the button and gives it the button type", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupButton>Run</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );

    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  test("draws the focus ring on the group, not the control", () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Query" />
      </InputGroup>,
    );

    expect(screen.getByRole("group")).toHaveClass(
      "has-[[data-slot=input-group-control]:focus-visible]:focus-ring",
    );
    expect(screen.getByRole("textbox", { name: "Query" })).toHaveClass(
      "focus-visible:ring-0",
      "focus-visible:outline-none",
    );
  });
});
