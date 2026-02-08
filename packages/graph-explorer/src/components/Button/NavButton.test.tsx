import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";

import { NavButton } from "./NavButton";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("NavButton", () => {
  test("should render children", () => {
    render(
      <MemoryRouter>
        <NavButton to="/test">Click me</NavButton>
      </MemoryRouter>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  test("should navigate when clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavButton to="/destination">Navigate</NavButton>
        <LocationDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/");

    await user.click(screen.getByRole("button"));

    expect(screen.getByTestId("location")).toHaveTextContent("/destination");
  });

  test("should not navigate when disabled", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavButton to="/destination" disabled>
          Navigate
        </NavButton>
        <LocationDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/");

    await user.click(screen.getByRole("button"));

    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  test("should be disabled when disabled prop is true", () => {
    render(
      <MemoryRouter>
        <NavButton to="/test" disabled>
          Disabled
        </NavButton>
      </MemoryRouter>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("should pass variant to Button", () => {
    render(
      <MemoryRouter>
        <NavButton to="/test" variant="primary">
          Primary
        </NavButton>
      </MemoryRouter>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "primary",
    );
  });
});
