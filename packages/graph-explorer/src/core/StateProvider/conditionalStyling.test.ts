import { createEdgeType, createVertexType } from "@/core";

import type { ConditionOperator, StyleCondition } from "./graphStyles";

import {
  buildConditionalEdgeSelector,
  buildConditionalNodeSelector,
  CONDITION_MET_DATA_KEY,
  evaluateStyleCondition,
  formatStyleCondition,
} from "./conditionalStyling";

function condition(
  attribute: string,
  operator: ConditionOperator,
  value: string,
): StyleCondition {
  return { attribute, operator, value };
}

describe("evaluateStyleCondition", () => {
  it("returns false when the attribute value is missing", () => {
    expect(evaluateStyleCondition(undefined, condition("x", "=", "1"))).toBe(
      false,
    );
  });

  describe("equality", () => {
    it("matches an equal string", () => {
      expect(
        evaluateStyleCondition("flagged", condition("s", "=", "flagged")),
      ).toBe(true);
    });

    it("matches a boolean against its string form", () => {
      expect(evaluateStyleCondition(true, condition("b", "=", "true"))).toBe(
        true,
      );
      expect(evaluateStyleCondition(false, condition("b", "=", "true"))).toBe(
        false,
      );
    });

    it("matches a number against its numeric string", () => {
      expect(evaluateStyleCondition(42, condition("n", "=", "42"))).toBe(true);
    });

    it("supports not-equals", () => {
      expect(
        evaluateStyleCondition("ok", condition("s", "!=", "flagged")),
      ).toBe(true);
    });
  });

  describe("numeric ordering", () => {
    it("compares numbers numerically, not lexicographically", () => {
      expect(evaluateStyleCondition(90, condition("n", ">", "50"))).toBe(true);
      expect(evaluateStyleCondition(9, condition("n", ">", "50"))).toBe(false);
      // Lexicographically "9" > "50", so this proves numeric comparison.
      expect(evaluateStyleCondition(9, condition("n", "<", "50"))).toBe(true);
    });
  });

  describe("date ordering", () => {
    it("compares ISO date strings chronologically", () => {
      const after = condition("d", ">", "2025-03-03");
      expect(evaluateStyleCondition("2026-01-01", after)).toBe(true);
      expect(evaluateStyleCondition("2024-01-01", after)).toBe(false);
    });

    it("compares non-ISO (M/D/YYYY) date strings chronologically", () => {
      // The bug: lexicographically "6/1/2024" > "2025-03-03" because '6' > '2'.
      // Chronologically it is earlier and must not match ">".
      const after = condition("d", ">", "2025-03-03");
      expect(evaluateStyleCondition("6/1/2026", after)).toBe(true);
      expect(evaluateStyleCondition("6/1/2024", after)).toBe(false);
    });
  });

  describe("string ordering fallback", () => {
    it("compares plain strings lexicographically", () => {
      expect(
        evaluateStyleCondition("banana", condition("s", ">", "apple")),
      ).toBe(true);
    });
  });
});

describe("formatStyleCondition", () => {
  it("renders a compact attribute/operator/value summary", () => {
    expect(
      formatStyleCondition(condition("create_date", ">", "2025-03-03")),
    ).toBe("create_date > 2025-03-03");
  });
});

describe("buildConditionalNodeSelector", () => {
  it("matches nodes of the type whose condition was met", () => {
    expect(buildConditionalNodeSelector(createVertexType("Person"))).toBe(
      `node[type="Person"][${CONDITION_MET_DATA_KEY} = "true"]`,
    );
  });
});

describe("buildConditionalEdgeSelector", () => {
  it("matches edges of the type whose condition was met", () => {
    expect(buildConditionalEdgeSelector(createEdgeType("KNOWS"))).toBe(
      `edge[type="KNOWS"][${CONDITION_MET_DATA_KEY} = "true"]`,
    );
  });
});
