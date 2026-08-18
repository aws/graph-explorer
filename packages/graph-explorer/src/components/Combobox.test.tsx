/**
 * @vitest-environment jsdom
 *
 * Combobox Component Tests
 *
 * Focus: Behavior-based tests at realistic scales (10, 20, 10,000 items)
 * No DOM node count assertions (virtualization is an implementation detail)
 *
 * Run: pnpm test Combobox.test.tsx
 */

import { render, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { Combobox, type ComboboxOption } from "./Combobox";

// jsdom never lays out elements, so offsetWidth/offsetHeight are always 0.
// TanStack Virtual measures the scroll container via offsetHeight to decide
// which rows are visible, so a real 0 means it renders zero rows. Give
// elements a realistic size so tests can assert against actually-rendered
// options.
beforeEach(() => {
  // Reads the element's own inline style when set (as our virtualized spacer
  // always does: style={{ height: `${totalSize}px` }}), falling back to a
  // fixed size otherwise. A blanket constant for every element can't tell
  // "measured the real bounded viewport" apart from "measured the spacer
  // that's deliberately as tall as the whole list" — both would report the
  // same fake number. Reading inline style keeps that distinction intact.
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      const inline = parseFloat(this.style.height);
      return Number.isFinite(inline) ? inline : 300;
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      const inline = parseFloat(this.style.width);
      return Number.isFinite(inline) ? inline : 300;
    },
  );
});

// Helper: Create test options
function createTestOptions(count: number): ComboboxOption[] {
  const options: ComboboxOption[] = [];
  for (let i = 0; i < count; i++) {
    options.push({
      label: `Vertex Type ${i.toString().padStart(5, "0")}`,
      value: `type_${i}`,
    });
  }
  return options;
}

describe("Combobox", () => {
  describe("Basic Rendering", () => {
    it("should render input with placeholder", () => {
      const options = createTestOptions(10);
      const { getByPlaceholderText } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = getByPlaceholderText("Select type");
      expect(input).toBeTruthy();
    });

    it("should show selected value in closed state", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} value="type_5" placeholder="Select type" />,
      );

      const input = container.querySelector("input");
      expect(input?.value).toBe("Vertex Type 00005");
    });

    it("should render accessible attributes", () => {
      const options = createTestOptions(10);
      const { getByPlaceholderText } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = getByPlaceholderText("Select type");
      expect(input.getAttribute("role")).toBe("combobox");
      expect(input.getAttribute("aria-expanded")).toBe("false");
      expect(input.getAttribute("aria-haspopup")).toBe("listbox");
      expect(input.getAttribute("aria-autocomplete")).toBe("list");
    });

    it("should render an inner label above the value, matching SelectField", () => {
      const options = createTestOptions(10);
      const { getByText, container } = render(
        <Combobox options={options} value="type_5" label="Node type" />,
      );

      expect(getByText("Node type")).toBeTruthy();
      const input = container.querySelector("input");
      expect(input?.value).toBe("Vertex Type 00005");
    });
  });

  describe("Accessible Labeling", () => {
    it("should use a caller-supplied aria-label instead of a hardcoded one", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox
          options={options}
          placeholder="Select type"
          aria-label="Node type"
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-label")).toBe("Node type");
    });

    it("should associate with an external label via id/htmlFor", () => {
      const options = createTestOptions(10);
      const { container, getByLabelText } = render(
        <div>
          <label htmlFor="nodeType">Node type</label>
          <Combobox id="nodeType" options={options} placeholder="Select type" />
        </div>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(getByLabelText("Node type")).toBe(input);
    });

    it("should associate its inner caption with the input via aria-labelledby", () => {
      const options = createTestOptions(10);
      const { getByLabelText } = render(
        <Combobox options={options} value="type_5" label="Node type" />,
      );

      expect(getByLabelText("Node type")).toBeTruthy();
    });
  });

  describe("Interaction & Selection", () => {
    it("should open on arrow key, not on focus", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // Initially closed
      expect(input.getAttribute("aria-expanded")).toBe("false");

      // Focus alone doesn't open it
      fireEvent.focus(input);
      expect(input.getAttribute("aria-expanded")).toBe("false");

      // Arrow Down opens it
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input.getAttribute("aria-expanded")).toBe("true");
    });

    it("should open on click", () => {
      // A <button> has "click" as its native default action, which is what
      // VoiceOver's Control-Option-Space reliably triggers; a text input
      // has no such default action unless we wire one up ourselves.
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-expanded")).toBe("false");

      fireEvent.click(input);
      expect(input.getAttribute("aria-expanded")).toBe("true");
    });

    it("should filter options on typing", async () => {
      const options = createTestOptions(20);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const unfilteredCount =
        document.querySelectorAll('[role="option"]').length;
      expect(unfilteredCount).toBeGreaterThan(1);

      fireEvent.change(input, { target: { value: "00010" } });
      expect(input.value).toBe("00010");

      await waitFor(() => {
        const filteredOptions = document.querySelectorAll('[role="option"]');
        expect(filteredOptions.length).toBe(1);
        expect(filteredOptions[0].textContent).toBe("Vertex Type 00010");
      });
    });

    it("should call onValueChange when an option is selected", async () => {
      const options = createTestOptions(10);
      const handleChange = vi.fn();

      const { container, findByText } = render(
        <Combobox
          options={options}
          placeholder="Select type"
          onValueChange={handleChange}
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "00005" } });

      const option = await findByText("Vertex Type 00005");
      fireEvent.click(option);

      expect(handleChange).toHaveBeenCalledWith("type_5");
    });

    it("should reset the filter and close when focus leaves for another field", async () => {
      // Regression test: tabbing away from the combobox to a sibling field
      // (e.g. the other Search Sidebar picker) must actually close the
      // popup. A bare fireEvent.blur() doesn't move jsdom's real focus
      // target, so this uses real .focus() calls to produce the same
      // blur+focusout sequence a browser fires when Tab moves focus; Base
      // UI's own dismiss handling reacts to that outside of React's act(),
      // so the resulting close is asserted asynchronously.
      const options = createTestOptions(10);
      const { container, getByTestId } = render(
        <div>
          <Combobox options={options} placeholder="Select type" />
          <button data-testid="next-field">Next field</button>
        </div>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const nextField = getByTestId("next-field");

      input.focus();
      fireEvent.change(input, { target: { value: "00005" } });
      expect(input.value).toBe("00005");

      nextField.focus();
      await waitFor(() => {
        expect(input.getAttribute("aria-expanded")).toBe("false");
        expect(input.value).toBe("");
      });

      // Reopening starts clean
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input.getAttribute("aria-expanded")).toBe("true");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should open on the VoiceOver Control-Option-Space hint without inserting a space", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      fireEvent.keyDown(input, {
        key: " ",
        code: "Space",
        ctrlKey: true,
        altKey: true,
      });

      expect(input.getAttribute("aria-expanded")).toBe("true");
      expect(input.value).toBe("");
    });

    it("should open on arrow key and respond to input", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // Initially closed
      expect(input.getAttribute("aria-expanded")).toBe("false");

      // Arrow Down opens combobox
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input.getAttribute("aria-expanded")).toBe("true");

      // Typing filters options
      fireEvent.change(input, { target: { value: "type" } });
      expect(input.value).toBe("type");
    });

    it("should track the focused option via aria-activedescendant", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // Not tracking anything while closed
      expect(input.getAttribute("aria-activedescendant")).toBeNull();

      // The listbox renders through a portal into document.body
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const firstOptionId = input.getAttribute("aria-activedescendant");
      expect(firstOptionId).toBeTruthy();
      expect(document.querySelector(`#${firstOptionId}`)).toBeTruthy();
      expect(document.querySelector(`#${firstOptionId}`)?.textContent).toBe(
        options[0].label,
      );

      fireEvent.keyDown(input, { key: "ArrowDown" });
      const secondOptionId = input.getAttribute("aria-activedescendant");
      expect(secondOptionId).not.toBe(firstOptionId);
      expect(document.querySelector(`#${secondOptionId}`)?.textContent).toBe(
        options[1].label,
      );
    });

    it("should keep listbox options out of the tab sequence", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // The listbox renders through a portal into document.body
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const optionButtons = document.querySelectorAll('[role="option"]');
      expect(optionButtons.length).toBeGreaterThan(0);
      optionButtons.forEach(option => {
        expect((option as HTMLElement).tabIndex).toBe(-1);
      });
    });

    it("should close on Escape", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input.getAttribute("aria-expanded")).toBe("true");

      fireEvent.keyDown(input, { key: "Escape" });
      expect(input.getAttribute("aria-expanded")).toBe("false");
    });

    it("should select the highlighted option with ArrowDown then Enter", async () => {
      const options = createTestOptions(10);
      const handleChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Combobox
          options={options}
          placeholder="Select type"
          onValueChange={handleChange}
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await user.click(input);
      await user.keyboard("{ArrowDown}{Enter}");

      expect(handleChange).toHaveBeenCalledWith("type_0");
    });

    it("should navigate well past the virtualized render window with the keyboard", () => {
      // Regression test: without Base UI's `virtualized` prop, CompositeList
      // truncates its internal ref list to only the ~13 currently-mounted
      // rows on every scroll remount, and useListNavigation's max index is
      // bounded by that truncated length — so arrowing far past the window
      // silently wraps back inside it instead of tracking the real option.
      // jsdom doesn't implement real scrolling, so the highlighted item's
      // DOM node isn't reliably present here; the ID Base UI assigns it
      // (`<input id>-<index>`) is the part that's actually under test.
      const largeOptions = createTestOptions(10000);
      const { container } = render(
        <Combobox options={largeOptions} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.keyDown(input, { key: "ArrowDown" });

      const stepsPastTheWindow = 60;
      for (let i = 0; i < stepsPastTheWindow; i++) {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      }

      // The first ArrowDown highlights index 0, so `stepsPastTheWindow` more
      // presses lands on that same index.
      expect(input.getAttribute("aria-activedescendant")).toBe(
        `${input.id}-${stepsPastTheWindow}`,
      );
    });

    it("should keep the toggle button in the accessibility tree, though not the tab order", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      // Exposed to screen readers (unlike an aria-hidden version): when the
      // input already has a value, VoiceOver's Read-All treats a filled
      // text input as content to read and skips announcing its combobox
      // role — this button is what re-announces "combo box" in that case.
      // Still not a Tab stop, matching Base UI's own Trigger default
      // (ArrowDown on the input already opens the list).
      const toggleButton = container.querySelector(
        "button",
      ) as HTMLButtonElement;
      expect(toggleButton.getAttribute("aria-hidden")).toBeNull();
      expect(toggleButton.tabIndex).toBe(-1);

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.getAttribute("aria-expanded")).toBe("false");
      fireEvent.click(toggleButton);
      expect(input.getAttribute("aria-expanded")).toBe("true");
    });

    it("should close the list when the toggle button is clicked again", async () => {
      // Base UI's click-to-open/close handling keys off the real
      // pointerdown-before-click sequence (it tracks which element was
      // pressed to distinguish "open the newly active trigger" from "toggle
      // this same trigger closed"). A bare fireEvent.click skips that
      // sequence and can't exercise the toggle-closed path. userEvent.click
      // doesn't work either here — it never registers the initial open on
      // this decorative button — so this dispatches the raw
      // pointer/mouse sequence directly instead.
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const toggleButton = container.querySelector(
        "button",
      ) as HTMLButtonElement;
      const input = container.querySelector("input") as HTMLInputElement;

      // Base UI's mousedown-based click handling defers the actual open/
      // close state update to a requestAnimationFrame tick (it waits for
      // focus to land before flipping state, to avoid a focus-visible
      // outline flash). A real user's click resolves that within one
      // frame; a test has to wait for it explicitly.
      function realClick(el: HTMLElement) {
        fireEvent.pointerDown(el, { pointerType: "mouse", button: 0 });
        fireEvent.mouseDown(el, { button: 0 });
        fireEvent.pointerUp(el, { pointerType: "mouse", button: 0 });
        fireEvent.mouseUp(el, { button: 0 });
        fireEvent.click(el, { button: 0 });
      }

      realClick(toggleButton);
      await waitFor(() =>
        expect(input.getAttribute("aria-expanded")).toBe("true"),
      );

      realClick(toggleButton);
      await waitFor(() =>
        expect(input.getAttribute("aria-expanded")).toBe("false"),
      );
    });
  });

  describe("No Results State", () => {
    it("should show no results message when filter matches nothing", () => {
      const options = createTestOptions(10);
      const { container, getByText } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "zzzzz_nonexistent" } });

      const noResultsMsg = getByText("No results found");
      expect(noResultsMsg).toBeTruthy();
    });
  });

  describe("Disabled State", () => {
    it("should not open when disabled", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox
          options={options}
          placeholder="Select type"
          disabled={true}
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.disabled).toBe(true);

      fireEvent.focus(input);

      // List should not appear — options render through a portal into
      // document.body, not into the render container.
      expect(document.querySelector('[role="option"]')).toBeFalsy();
    });
  });

  describe("Performance at Scale (10,000 options)", () => {
    it("should select a specific late item after filtering", async () => {
      const largeOptions = createTestOptions(10000);
      const handleChange = vi.fn();
      const { container, findByText } = render(
        <Combobox
          options={largeOptions}
          placeholder="Select type"
          onValueChange={handleChange}
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "08500" } });

      const option = await findByText("Vertex Type 08500");
      fireEvent.click(option);

      expect(handleChange).toHaveBeenCalledWith("type_8500");
    });

    it("should filter then select via ArrowDown and Enter", async () => {
      const largeOptions = createTestOptions(10000);
      const handleChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Combobox
          options={largeOptions}
          placeholder="Select type"
          onValueChange={handleChange}
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await user.click(input);
      await user.type(input, "08500");
      await waitFor(() => {
        expect(document.querySelectorAll('[role="option"]').length).toBe(1);
      });
      await user.keyboard("{ArrowDown}{Enter}");

      expect(handleChange).toHaveBeenCalledWith("type_8500");
    });
  });
});
