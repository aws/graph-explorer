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

  it("should show truncation hint when results are capped", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByText(/Showing 64 of/)).toBeInTheDocument();
  });

  it("should hide truncation hint when fewer results than cap", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "airplay");

    expect(screen.queryByText(/Showing 64 of/)).not.toBeInTheDocument();
  });

  it("should show no results message for invalid search", async () => {
    const user = userEvent.setup();
    render(<IconPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "zzzznotanicon");

    expect(screen.getByText("No icons found")).toBeInTheDocument();
  });

  it("should call onSelect with lucide:<name> reference when icon is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<IconPicker onSelect={onSelect} />);

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
    const iconName = firstIcon.getAttribute("title");
    await user.click(firstIcon);

    expect(onSelect).toHaveBeenCalledWith(
      `lucide:${iconName}`,
      "image/svg+xml",
    );
  });

  it("should highlight the icon matching currentIconUrl", async () => {
    const user = userEvent.setup();
    render(<IconPicker currentIconUrl="lucide:airplay" onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      const airplayBtn = screen
        .getAllByRole("button")
        .find(btn => btn.title === "airplay");
      expect(airplayBtn).toBeDefined();
      expect(airplayBtn).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("should not highlight any icon when currentIconUrl is not a lucide ref", async () => {
    const user = userEvent.setup();
    render(
      <IconPicker
        currentIconUrl="data:image/svg+xml;base64,XXXX"
        onSelect={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      const iconButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.title && btn.title !== "");
      expect(iconButtons.length).toBeGreaterThan(0);
      for (const btn of iconButtons) {
        expect(btn).toHaveAttribute("aria-pressed", "false");
      }
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
