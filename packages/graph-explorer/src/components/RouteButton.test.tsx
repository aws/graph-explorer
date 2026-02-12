import type { PropsWithChildren } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, test } from "vitest";

import { RouteButtonGroup } from "./RouteButton";
import { TooltipProvider } from "./Tooltip";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function Wrapper({ children }: PropsWithChildren) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

describe("RouteButtonGroup", () => {
  test("should render all route buttons on large screens", () => {
    render(
      <MemoryRouter initialEntries={["/graph-explorer"]}>
        <RouteButtonGroup active="graph-explorer" />
      </MemoryRouter>,
      { wrapper: Wrapper },
    );

    expect(screen.getByRole("button", { name: "Graph" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Data Table" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schema" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  test("should render nav menu trigger button", () => {
    render(
      <MemoryRouter initialEntries={["/graph-explorer"]}>
        <RouteButtonGroup active="graph-explorer" />
      </MemoryRouter>,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole("button", { name: "Navigation" }),
    ).toBeInTheDocument();
  });

  test("should open nav menu with radio items on click", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/graph-explorer"]}>
        <RouteButtonGroup active="graph-explorer" />
      </MemoryRouter>,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByRole("button", { name: "Navigation" }));

    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitemradio", { name: "Graph" }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitemradio", { name: "Data Table" }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitemradio", { name: "Schema" }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitemradio", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitemradio", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  test("should mark the active route as checked in nav menu", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/data-explorer"]}>
        <RouteButtonGroup active="data-explorer" />
      </MemoryRouter>,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByRole("button", { name: "Navigation" }));

    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitemradio", { name: "Data Table" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(menu).getByRole("menuitemradio", { name: "Graph" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  test("should navigate when selecting a route from nav menu", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/graph-explorer"]}>
        <RouteButtonGroup active="graph-explorer" />
        <LocationDisplay />
      </MemoryRouter>,
      { wrapper: Wrapper },
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");

    await user.click(screen.getByRole("button", { name: "Navigation" }));
    await user.click(
      screen.getByRole("menuitemradio", { name: "Connections" }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/connections");
  });
});
