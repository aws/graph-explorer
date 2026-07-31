// @vitest-environment happy-dom
import type { ComponentProps } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { IconPicker } from "./IconPicker";
import { TooltipProvider } from "./Tooltip";

// The icon tooltips require a TooltipProvider ancestor, which the app supplies
// globally in DefaultLayout.
function renderPicker(props: Partial<ComponentProps<typeof IconPicker>> = {}) {
  const { children = <button>Browse</button>, ...rest } = props;
  return render(
    <IconPicker onSelect={vi.fn()} {...rest}>
      {children}
    </IconPicker>,
    { wrapper: TooltipProvider },
  );
}

// Icon buttons are the only buttons in the picker with `aria-pressed`, and
// their tooltip surfaces the icon name as the accessible name (aria-label).
function visibleIconButtons() {
  return screen
    .getAllByRole("button")
    .filter(btn => btn.hasAttribute("aria-pressed"));
}

function firstVisibleIcon() {
  return visibleIconButtons()[0];
}

function iconName(btn: HTMLElement) {
  return btn.getAttribute("aria-label") ?? "";
}

function visibleIconNames() {
  return visibleIconButtons().map(iconName);
}

describe("IconPicker", () => {
  it("should render Browse button", () => {
    renderPicker();
    expect(screen.getByRole("button", { name: /browse/i })).toBeInTheDocument();
  });

  it("should open popover with search input on click", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByPlaceholderText("Search icons...")).toBeInTheDocument();
  });

  it("should show icons in the grid", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));

    // Wait for at least some icon buttons to appear in the grid
    await waitFor(() => {
      expect(visibleIconButtons().length).toBeGreaterThan(0);
    });
  });

  it("should filter icons when searching", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "user");

    await waitFor(() => {
      const matching = visibleIconButtons().filter(btn =>
        iconName(btn).includes("user"),
      );
      expect(matching.length).toBeGreaterThan(0);
    });
  });

  it("should show the pager when the icons span more than one page", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it("should hide the pager when the results fit on one page", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "airplay");

    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
  });

  it("should advance to the next page and show different icons", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const firstPageIcons = visibleIconNames();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
    expect(visibleIconNames()).not.toEqual(firstPageIcons);
  });

  it("should disable Previous on the first page", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Next page" }),
    ).not.toBeDisabled();
  });

  it("should disable Next on the last page", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    // "arrow" matches enough icons to fill exactly two pages.
    await user.type(screen.getByPlaceholderText("Search icons..."), "arrow");
    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).not.toBeDisabled();
  });

  it("should return to the first page when the search changes", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search icons..."), "a");

    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it("should clear the search when the popover is reopened", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    await user.type(screen.getByPlaceholderText("Search icons..."), "airplay");

    // Close by pressing Escape, then reopen.
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search icons..."),
      ).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByPlaceholderText("Search icons...")).toHaveValue("");
  });

  it("should always open on the first page, even with a selection on a later page", async () => {
    const user = userEvent.setup();
    // "zap" sorts near the end of the alphabetised list, well past page 1.
    renderPicker({ currentIconUrl: "lucide:zap" });

    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it("should reopen on the same page after closing with Escape", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search icons..."),
      ).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
  });

  it("should reset to the first page when the component is remounted", async () => {
    const user = userEvent.setup();
    // Remounting mirrors the node style dialog closing and reopening, which
    // unmounts the picker and discards its page state.
    const { unmount } = renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();

    unmount();
    renderPicker();
    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it("should reopen on the same page after selecting an icon", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();

    await user.click(firstVisibleIcon());
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search icons..."),
      ).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /browse/i }));

    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
  });

  it("should show no results message for invalid search", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));
    const searchInput = screen.getByPlaceholderText("Search icons...");

    await user.type(searchInput, "zzzznotanicon");

    expect(screen.getByText("No icons found")).toBeInTheDocument();
  });

  it("should call onSelect with lucide:<name> reference when icon is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderPicker({ onSelect });

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      expect(visibleIconButtons().length).toBeGreaterThan(0);
    });

    const firstIcon = firstVisibleIcon();
    const name = iconName(firstIcon);
    await user.click(firstIcon);

    expect(onSelect).toHaveBeenCalledWith(`lucide:${name}`, "image/svg+xml");
  });

  it("should highlight the icon matching currentIconUrl", async () => {
    const user = userEvent.setup();
    renderPicker({ currentIconUrl: "lucide:airplay" });

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      const airplayBtn = screen.getByRole("button", { name: "airplay" });
      expect(airplayBtn).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("should not highlight any icon when currentIconUrl is not a lucide ref", async () => {
    const user = userEvent.setup();
    renderPicker({ currentIconUrl: "data:image/svg+xml;base64,XXXX" });

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      const iconButtons = visibleIconButtons();
      expect(iconButtons.length).toBeGreaterThan(0);
      for (const btn of iconButtons) {
        expect(btn).toHaveAttribute("aria-pressed", "false");
      }
    });
  });

  it("should close popover after selecting an icon", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /browse/i }));

    await waitFor(() => {
      expect(visibleIconButtons().length).toBeGreaterThan(0);
    });

    await user.click(firstVisibleIcon());

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search icons..."),
      ).not.toBeInTheDocument();
    });
  });
});
