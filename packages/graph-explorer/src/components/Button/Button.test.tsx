import type { PropsWithChildren } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "../Tooltip";
import { Button } from "./Button";

function Wrapper({ children }: PropsWithChildren) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

describe("Button", () => {
  test("should render children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  test("should render tooltip when tooltip prop is provided", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <Button tooltip="Helpful tip">Hover me</Button>
      </Wrapper>,
    );

    const button = screen.getByRole("button");
    await user.hover(button);

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Helpful tip");
  });

  test("should render screen reader text when tooltip is provided", () => {
    render(
      <Wrapper>
        <Button tooltip="Screen reader text">Click me</Button>
      </Wrapper>,
    );

    const srText = screen.getByText("Screen reader text");
    expect(srText).toHaveClass("sr-only");
  });

  test("should not render tooltip when tooltip is not provided", () => {
    render(<Button>No tooltip</Button>);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("should handle onClick events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
