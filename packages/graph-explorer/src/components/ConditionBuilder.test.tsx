// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";

import { ConditionBuilder, createDefaultCondition } from "./ConditionBuilder";

describe("createDefaultCondition", () => {
  it("uses the first attribute option with an equals operator and empty value", () => {
    expect(
      createDefaultCondition([
        { label: "Score", value: "score" },
        { label: "Name", value: "name" },
      ]),
    ).toStrictEqual({ attribute: "score", operator: "=", value: "" });
  });

  it("falls back to an empty attribute when there are no options", () => {
    expect(createDefaultCondition([])).toStrictEqual({
      attribute: "",
      operator: "=",
      value: "",
    });
  });
});

describe("ConditionBuilder", () => {
  it("emits the updated condition when the value changes", () => {
    const onChange = vi.fn();
    render(
      <ConditionBuilder
        condition={{ attribute: "score", operator: ">", value: "10" }}
        attributeOptions={[{ label: "Score", value: "score" }]}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "20" },
    });

    expect(onChange).toHaveBeenCalledWith({
      attribute: "score",
      operator: ">",
      value: "20",
    });
  });
});
