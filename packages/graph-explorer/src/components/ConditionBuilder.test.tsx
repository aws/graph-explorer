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

  it("hides the case-sensitivity checkbox for an ordering operator", () => {
    render(
      <ConditionBuilder
        condition={{ attribute: "score", operator: ">", value: "10" }}
        attributeOptions={[{ label: "Score", value: "score" }]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("shows a checked case-sensitivity checkbox by default for equals", () => {
    render(
      <ConditionBuilder
        condition={{ attribute: "score", operator: "=", value: "10" }}
        attributeOptions={[{ label: "Score", value: "score" }]}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /case sensitive/i }),
    ).toBeChecked();
  });

  it("emits caseSensitive: false when the checkbox is unchecked for matches", () => {
    const onChange = vi.fn();
    render(
      <ConditionBuilder
        condition={{ attribute: "score", operator: "matches", value: "Jo*" }}
        attributeOptions={[{ label: "Score", value: "score" }]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /case sensitive/i }));

    expect(onChange).toHaveBeenCalledWith({
      attribute: "score",
      operator: "matches",
      value: "Jo*",
      caseSensitive: false,
    });
  });
});
