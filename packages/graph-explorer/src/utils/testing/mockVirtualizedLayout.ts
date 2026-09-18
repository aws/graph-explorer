import { vi } from "vitest";

/**
 * jsdom/happy-dom report offsetWidth/offsetHeight as 0, so TanStack Virtual
 * measures the scroll container as having no visible rows. Read each element's
 * own inline style when it is set (the virtualized spacer sets
 * `style={{ height: `${totalSize}px` }}`) and fall back to a realistic
 * viewport size so tests assert against actually-rendered options.
 */
export function mockVirtualizedLayout() {
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
}
