// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import SelectField from "./SelectField";

const options = [
  { label: "Gremlin", value: "gremlin" },
  { label: "SPARQL", value: "sparql" },
];

describe("SelectField", () => {
  test.each(["top", "inner"] as const)(
    "names and disables the trigger with the %s label placement",
    labelPlacement => {
      render(
        <SelectField
          aria-label="Query Language"
          labelPlacement={labelPlacement}
          options={options}
          value="sparql"
          onValueChange={() => {}}
          disabled
        />,
      );

      const trigger = screen.getByRole("combobox", { name: "Query Language" });
      expect(trigger).toHaveTextContent("SPARQL");
      expect(trigger).toBeDisabled();
    },
  );
});
