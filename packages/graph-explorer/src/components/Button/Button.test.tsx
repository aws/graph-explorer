import type { PropsWithChildren } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "../Tooltip";
import { Button, stopPropagation } from "./Button";

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

  test("should set aria-label when tooltip is provided", () => {
    render(
      <Wrapper>
        <Button tooltip="Accessible label">Click me</Button>
      </Wrapper>,
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Accessible label",
    );
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

describe("stopPropagation", () => {
  test("should stop event propagation and call action", async () => {
    const action = vi.fn();
    const event = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    await stopPropagation(action)(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(action).toHaveBeenCalled();
  });

  test("should handle async actions", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const event = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    await stopPropagation(action)(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(action).toHaveBeenCalled();
  });
});
