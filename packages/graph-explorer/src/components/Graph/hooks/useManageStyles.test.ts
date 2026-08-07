import { getStyles } from "./useManageStyles";

/**
 * Cytoscape resolves its stylesheet as an order-based cascade: for a given
 * element, a property set by a later rule overrides the same property from an
 * earlier rule (there is no CSS-style specificity). Conditional styling relies
 * on this — the conditional selectors arrive through the external `styles`
 * object, which `getStyles` inserts before the selection / dimming / hidden
 * overrides. This test locks that ordering so a conditionally-styled entity
 * still shows selection and out-of-focus dimming.
 */
describe("getStyles conditional precedence", () => {
  it("orders external (conditional) selectors before the state overrides", () => {
    const conditionalSelector = 'node[type="Person"][conditionMet = "true"]';

    const rootStyles = getStyles({
      styles: { [conditionalSelector]: { "background-color": "#ff0000" } },
      layout: "FORCE",
    });

    const selectors = rootStyles.map(style => style.selector);
    const conditionalIndex = selectors.indexOf(conditionalSelector);

    expect(conditionalIndex).toBeGreaterThanOrEqual(0);
    expect(conditionalIndex).toBeLessThan(selectors.indexOf("node:selected"));
    expect(conditionalIndex).toBeLessThan(selectors.indexOf("node.hidden"));
    expect(conditionalIndex).toBeLessThan(
      selectors.indexOf("node.out-of-focus"),
    );
  });
});
