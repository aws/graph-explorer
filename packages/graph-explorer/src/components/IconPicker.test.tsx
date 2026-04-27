// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { IconPicker } from "./IconPicker";

describe("IconPicker", () => {
  it("should render Browse button", () => {
    render(<IconPicker onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /browse/i })).toBeInTheDocument();
  });

  it("should open popover with search input on click", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByPlaceholderText("Search icons...")).toBeInTheDocument();
  });

  it("should show icons in the grid", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));

    // Wait for at least some icon buttons to appear in the grid
    await waitFor(() => {
      const iconButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.title && btn.title !== "");
      expect(iconButtons.length).toBeGreaterThan(0);
    });
  });

  it("should filter icons when searching", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "user");

    await waitFor(() => {
      const iconButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.title && btn.title.includes("user"));
      expect(iconButtons.length).toBeGreaterThan(0);
    });
  });

  it("should show no results message for invalid search", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "zzzznotanicon");

    expect(screen.getByText("No icons found")).toBeInTheDocument();
  });

  it("should call onSelect with data URI when icon is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<IconPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));

    // Wait for icons to load then click the first one
    await waitFor(() => {
      const iconButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.title && btn.title !== "");
      expect(iconButtons.length).toBeGreaterThan(0);
    });

    const firstIcon = screen
      .getAllByRole("button")
      .filter(btn => btn.title && btn.title !== "")[0];
    await user.click(firstIcon);

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        "image/svg+xml",
      );
    });
  });

  it("should close popover after selecting an icon", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      const iconButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.title && btn.title !== "");
      expect(iconButtons.length).toBeGreaterThan(0);
    });

    const firstIcon = screen
      .getAllByRole("button")
      .filter(btn => btn.title && btn.title !== "")[0];
    await user.click(firstIcon);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search icons..."),
      ).not.toBeInTheDocument();
    });
  });
});
