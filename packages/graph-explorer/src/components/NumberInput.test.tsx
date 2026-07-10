// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { useDeferredValue, useState } from "react";

import { NumberInput } from "./NumberInput";

function Harness({
  initialValue,
  onChange = () => {},
  ...props
}: {
  initialValue: number | undefined;
  onChange?: (value: number | undefined) => void;
} & Omit<React.ComponentProps<typeof NumberInput>, "value" | "onValueChange">) {
  const [value, setValue] = useState(initialValue);
  return (
    <NumberInput
      aria-label="width"
      value={value}
      onValueChange={next => {
        setValue(next);
        onChange(next);
      }}
      {...props}
    />
  );
}

function widthInput() {
  return screen.getByLabelText<HTMLInputElement>("width");
}

// The browser reports the raw editing buffer (e.g. "1.") through the change
// event. These tests fire those buffers directly, which is exactly what
// user typing produces in a real browser.
describe("NumberInput", () => {
  it("should render the numeric value", () => {
    render(<Harness initialValue={1.4} />);
    expect(widthInput()).toHaveValue(1.4);
  });

  it("should render empty when the value is undefined", () => {
    render(<Harness initialValue={undefined} />);
    expect(widthInput().value).toBe("");
  });

  it("should preserve a trailing decimal point while editing", () => {
    // Regression for aws/graph-explorer#1906: deleting the 4 from "1.4"
    // collapsed "1." back to "1", destroying the decimal point.
    const onChange = vi.fn();
    render(<Harness initialValue={1.4} onChange={onChange} />);

    fireEvent.change(widthInput(), { target: { value: "1." } });

    expect(widthInput().value).toBe("1.");
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("should allow retyping a decimal digit after deleting one", () => {
    const onChange = vi.fn();
    render(<Harness initialValue={1.4} onChange={onChange} />);

    fireEvent.change(widthInput(), { target: { value: "1." } });
    fireEvent.change(widthInput(), { target: { value: "1.2" } });

    expect(widthInput().value).toBe("1.2");
    expect(onChange).toHaveBeenLastCalledWith(1.2);
  });

  it("should clear with a single deletion and report undefined", () => {
    const onChange = vi.fn();
    render(<Harness initialValue={5} onChange={onChange} />);

    fireEvent.change(widthInput(), { target: { value: "" } });

    expect(widthInput().value).toBe("");
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("should reformat to the canonical value on blur", () => {
    render(<Harness initialValue={1.4} />);

    fireEvent.change(widthInput(), { target: { value: "1." } });
    fireEvent.blur(widthInput());

    expect(widthInput()).toHaveValue(1);
  });

  it("should reflect external value changes when not editing", () => {
    function ExternalChange() {
      const [value, setValue] = useState<number | undefined>(1);
      return (
        <>
          <NumberInput
            aria-label="width"
            value={value}
            onValueChange={setValue}
          />
          <button onClick={() => setValue(7)}>reset</button>
        </>
      );
    }
    render(<ExternalChange />);

    fireEvent.click(screen.getByRole("button", { name: "reset" }));

    expect(widthInput()).toHaveValue(7);
  });

  it("should reset after editing when value is deferred", () => {
    function DeferredParent() {
      const [raw, setRaw] = useState<number | undefined>(0);
      const deferred = useDeferredValue(raw);
      return (
        <>
          <NumberInput
            aria-label="width"
            value={deferred}
            onValueChange={setRaw}
          />
          <button onClick={() => setRaw(0)}>reset</button>
        </>
      );
    }
    render(<DeferredParent />);

    fireEvent.change(widthInput(), { target: { value: "3.5" } });
    expect(widthInput().value).toBe("3.5");

    fireEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(widthInput()).toHaveValue(0);
  });

  it("should reset after clearing when value is deferred", () => {
    function DeferredParent() {
      const [raw, setRaw] = useState<number | undefined>(2);
      const deferred = useDeferredValue(raw);
      return (
        <>
          <NumberInput
            aria-label="width"
            value={deferred}
            onValueChange={setRaw}
          />
          <button onClick={() => setRaw(2)}>reset</button>
        </>
      );
    }
    render(<DeferredParent />);

    fireEvent.change(widthInput(), { target: { value: "5" } });
    fireEvent.change(widthInput(), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(widthInput()).toHaveValue(2);
  });

  it("should reset after an edit that did not change the parsed value", () => {
    function Parent() {
      const [value, setValue] = useState<number | undefined>(1.4);
      return (
        <>
          <NumberInput
            aria-label="width"
            value={value}
            onValueChange={setValue}
          />
          <button onClick={() => setValue(0)}>reset</button>
        </>
      );
    }
    render(<Parent />);

    // Trailing zero: "1.40" still parses to 1.4, so value prop doesn't change
    fireEvent.change(widthInput(), { target: { value: "1.40" } });
    expect(widthInput().value).toBe("1.40");

    fireEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(widthInput()).toHaveValue(0);
  });

  it("should accept an external value change to a non-default value", () => {
    function Parent() {
      const [value, setValue] = useState<number | undefined>(1);
      return (
        <>
          <NumberInput
            aria-label="width"
            value={value}
            onValueChange={setValue}
          />
          <button onClick={() => setValue(9.5)}>set-external</button>
        </>
      );
    }
    render(<Parent />);

    fireEvent.change(widthInput(), { target: { value: "3" } });
    expect(widthInput().value).toBe("3");

    fireEvent.click(screen.getByRole("button", { name: "set-external" }));
    expect(widthInput().value).toBe("9.5");
  });

  it("should preserve buffer across rapid edits", () => {
    const onChange = vi.fn();
    render(<Harness initialValue={1} onChange={onChange} />);

    fireEvent.change(widthInput(), { target: { value: "1." } });
    fireEvent.change(widthInput(), { target: { value: "1.5" } });
    fireEvent.change(widthInput(), { target: { value: "1.55" } });

    expect(widthInput().value).toBe("1.55");
    expect(onChange).toHaveBeenLastCalledWith(1.55);
  });
});
