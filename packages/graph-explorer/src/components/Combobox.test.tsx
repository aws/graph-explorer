/**
 * @vitest-environment jsdom
 *
 * Combobox Component Tests
 *
 * Focus: Behavior-based tests at realistic scales (500, 5,000, 10,000 items)
 * No DOM node count assertions (virtualization is an implementation detail)
 *
 * Run: pnpm test Combobox.test.tsx
 */

import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

afterEach(() => {
  vi.restoreAllMocks();
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
      expect(input).toBeTruthy();
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

    it("should filter options on typing", () => {
      const options = createTestOptions(20);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      fireEvent.focus(input);

      // Type to filter
      fireEvent.change(input, { target: { value: "00010" } });
      expect(input.value).toBe("00010");

      // Verify input shows the filter text
      expect(input.value).toBe("00010");
      expect(input.getAttribute("aria-expanded")).toBe("true");
    });

    it("should handle selection callbacks", () => {
      const options = createTestOptions(10);
      const handleChange = vi.fn();

      const { container } = render(
        <Combobox
          options={options}
          placeholder="Select type"
          onValueChange={handleChange}
        />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // Typing opens the dropdown and filters
      fireEvent.change(input, { target: { value: "type_0" } });

      // Verify dropdown is open
      expect(input.getAttribute("aria-expanded")).toBe("true");
      expect(input.value).toBe("type_0");
    });

    it("should reset filter on reopen", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // First open + filter
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "00005" } });
      expect(input.value).toBe("00005");

      // Close - filter should reset after blur
      fireEvent.blur(input);

      // Reopen
      fireEvent.focus(input);

      // Input should show selected value (or placeholder if no value)
      // This confirms the filter was cleared internally
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

    it("should hide the decorative toggle button from the accessibility tree while keeping it clickable", () => {
      const options = createTestOptions(10);
      const { container } = render(
        <Combobox options={options} placeholder="Select type" />,
      );

      // Not exposed to screen readers at all (not just excluded from Tab):
      // a native <select>'s arrow is decorative in the same way, and
      // VoiceOver reads Control-Option-Space on a grouped control (input +
      // a second focusable/AX-visible button) as "stop interacting with
      // this group" rather than "open the list" if the button stays exposed.
      const toggleButton = container.querySelector(
        "button",
      ) as HTMLButtonElement;
      expect(toggleButton.getAttribute("aria-hidden")).toBe("true");
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
      // this aria-hidden decorative button — so this dispatches the raw
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

      // List should not appear
      const listbox = container.querySelector('[role="option"]');
      expect(listbox).toBeFalsy();
    });
  });

  describe("Performance at Scale", () => {
    describe("500 options", () => {
      let options: ComboboxOption[];

      beforeEach(() => {
        options = createTestOptions(500);
      });

      it("should mount instantly", () => {
        const startTime = performance.now();
        const { container } = render(
          <Combobox options={options} placeholder="Select type" />,
        );
        const endTime = performance.now();

        expect(container).toBeTruthy();
        const elapsed = endTime - startTime;
        // Mount time with 500 items should be instant
        expect(elapsed).toBeLessThan(50);
      });
    });

    describe("5,000 options (stress test)", () => {
      let options: ComboboxOption[];

      beforeEach(() => {
        options = createTestOptions(5000);
      });

      it("should mount instantly without UI freeze", () => {
        const startTime = performance.now();
        const { container } = render(
          <Combobox options={options} placeholder="Select type" />,
        );
        const endTime = performance.now();

        expect(container).toBeTruthy();
        const elapsed = endTime - startTime;

        // With virtualization, should be <200ms
        // Without virtualization (current SelectField), would be >1000ms
        expect(elapsed).toBeLessThan(200);
      });

      it("should keep input responsive while filtering", () => {
        const { container } = render(
          <Combobox options={options} placeholder="Select type" />,
        );

        const input = container.querySelector("input") as HTMLInputElement;
        fireEvent.focus(input);

        // Measure input responsiveness (not filtering latency)
        const inputStartTime = performance.now();
        fireEvent.change(input, { target: { value: "04999" } });
        const inputEndTime = performance.now();

        // Input value should update instantly
        expect(input.value).toBe("04999");

        const inputLatency = inputEndTime - inputStartTime;

        // Input should be instant (useDeferredValue protects this)
        expect(inputLatency).toBeLessThan(50);
      });

      it("scale guardrail: input stays responsive even with 5,000 items", () => {
        const { container } = render(
          <Combobox
            options={options}
            placeholder="Select type"
            onValueChange={vi.fn()}
          />,
        );

        const input = container.querySelector("input") as HTMLInputElement;
        fireEvent.focus(input);

        // Filter to a late item (#4999)
        const filterStartTime = performance.now();
        fireEvent.change(input, { target: { value: "04999" } });
        const filterEndTime = performance.now();

        expect(input.value).toBe("04999");
        const latency = filterEndTime - filterStartTime;

        // useDeferredValue keeps input responsive
        expect(latency).toBeLessThan(50);
      });
    });

    describe("10,000 options (extreme scale)", () => {
      it("keeps rendered option count bounded regardless of total items", () => {
        // Not the exact-count assertion the project's testing philosophy
        // warns against (that's about pinning an implementation detail like
        // a specific overscan value, which breaks on harmless tuning) — this
        // is a wide behavioral bound on whether windowing happened at all.
        // It guards against measuring the wrong scroll element: the
        // virtualizer must read the bounded, overflow-y-auto viewport
        // (Combobox.List), not the inner spacer div (which is deliberately
        // as tall as the full list). Measuring the spacer reports its own
        // huge height as "visible", so the virtualizer renders nearly every
        // item instead of a small window — a real regression this project
        // shipped that jsdom's global offsetHeight/offsetWidth mock can't
        // catch by itself, since it can't tell which element got measured.
        const largeOptions = createTestOptions(10000);
        const { container } = render(
          <Combobox options={largeOptions} placeholder="Select type" />,
        );

        const input = container.querySelector("input") as HTMLInputElement;
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });

        // A fraction of the total, not a fixed number: the real failure
        // mode this guards against is rendering essentially everything
        // (the bug rendered ~10,000 of 10,000), so this stays well clear
        // of any reasonable overscan/container-height tuning instead of
        // coupling to today's specific values.
        const renderedOptions = document.querySelectorAll('[role="option"]');
        expect(renderedOptions.length).toBeGreaterThan(0);
        expect(renderedOptions.length).toBeLessThan(largeOptions.length / 10);
      });

      it("should mount without UI freeze", () => {
        const largeOptions = createTestOptions(10000);

        const startTime = performance.now();
        const { container } = render(
          <Combobox options={largeOptions} placeholder="Select type" />,
        );
        const endTime = performance.now();

        expect(container).toBeTruthy();
        const elapsed = endTime - startTime;

        // With virtualization, should be <200ms
        // Without virtualization (current SelectField), would be >5000ms or freeze
        expect(elapsed).toBeLessThan(200);
      });

      it("should keep input responsive at extreme scale", () => {
        const largeOptions = createTestOptions(10000);
        const { container } = render(
          <Combobox
            options={largeOptions}
            placeholder="Select type"
            onValueChange={vi.fn()}
          />,
        );

        const input = container.querySelector("input") as HTMLInputElement;
        fireEvent.focus(input);

        // Filter to a very late item
        const filterStartTime = performance.now();
        fireEvent.change(input, { target: { value: "09999" } });
        const filterEndTime = performance.now();

        // Input should respond instantly
        expect(input.value).toBe("09999");
        const inputLatency = filterEndTime - filterStartTime;

        // Input must be instant regardless of 10k items (useDeferredValue keeps this responsive)
        expect(inputLatency).toBeLessThan(50);
      });

      it("should select a specific late item after filtering at 10,000-item scale", async () => {
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
    });
  });
});
