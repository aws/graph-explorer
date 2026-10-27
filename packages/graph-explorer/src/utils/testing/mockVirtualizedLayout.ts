import { vi } from "vite-plus/test";

/**
 * jsdom/happy-dom report element sizes as 0, so TanStack Virtual measures the
 * scroll container as having no visible rows. Read each element's own inline
 * style when it is set (the virtualized spacer sets
 * `style={{ height: `${totalSize}px` }}`) and fall back to a realistic
 * viewport size so tests assert against actually-rendered options.
 *
 * Both the offset and client sizes are stubbed because virtual-core reads the
 * scroll element through `offsetHeight` up to 3.19.2 and `clientHeight` from
 * 3.19.7 on.
 */
export function mockVirtualizedLayout() {
  for (const prop of ["offsetHeight", "clientHeight"] as const) {
    vi.spyOn(HTMLElement.prototype, prop, "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return inlineSizeOrDefault(this.style.height);
    });
  }
  for (const prop of ["offsetWidth", "clientWidth"] as const) {
    vi.spyOn(HTMLElement.prototype, prop, "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return inlineSizeOrDefault(this.style.width);
    });
  }
}

function inlineSizeOrDefault(inline: string) {
  const size = parseFloat(inline);
  return Number.isFinite(size) ? size : 300;
}
