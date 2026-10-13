// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import dynamicIconImports from "lucide-react/dynamicIconImports";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import logger from "@/utils/logger";
import { createSvgIconDataUrl } from "@/utils/testing";

import { iconRegistry } from "./iconRegistry";
import { classifyIconSource, iconSourceId } from "./iconSource";

const SQUARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>`;

function svgSource(url: string) {
  return classifyIconSource({ iconUrl: url, iconImageType: "image/svg+xml" });
}

function lucideSource(name: string) {
  return classifyIconSource({
    iconUrl: `lucide:${name}`,
    iconImageType: "image/svg+xml",
  });
}

/** Waits for the registry to settle every requested source. */
async function settle() {
  await vi.waitFor(() => expect(iconRegistry.pendingCount).toBe(0));
}

describe("iconRegistry", () => {
  beforeEach(() => {
    iconRegistry.reset();
  });

  it("starts with an empty snapshot", () => {
    expect(iconRegistry.getSnapshot().size).toBe(0);
  });

  // A url needs no resolution, so making the consumer wait a render for it
  // would be a pointless async round trip.
  it("resolves a raster icon to its url synchronously", () => {
    const source = classifyIconSource({
      iconUrl: "data:image/png;base64,QUJD",
      iconImageType: "image/png",
    });

    iconRegistry.request([source]);

    expect(iconRegistry.getSnapshot().get(iconSourceId(source)!)).toStrictEqual(
      { kind: "raster", url: "data:image/png;base64,QUJD" },
    );
    expect(iconRegistry.pendingCount).toBe(0);
  });

  // The markup is already in the data url, so there is nothing to wait for.
  it("decodes and sanitizes an svg data url synchronously", () => {
    const source = svgSource(createSvgIconDataUrl(SQUARE_SVG));

    iconRegistry.request([source]);

    const resolved = iconRegistry.getSnapshot().get(iconSourceId(source)!);
    expect(resolved).toMatchObject({
      kind: "svg",
      svg: expect.stringContaining('d="M4 4h16v16H4z"'),
    });
    expect(iconRegistry.pendingCount).toBe(0);
  });

  // The uploader base64-encodes the file's bytes, so text must be decoded as
  // UTF-8 rather than one character per byte.
  it("decodes non-ascii svg text as utf-8", () => {
    const source = svgSource(
      createSvgIconDataUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text>Café ☕</text></svg>`,
      ),
    );

    iconRegistry.request([source]);

    expect(iconRegistry.getSnapshot().get(iconSourceId(source)!)).toMatchObject(
      { svg: expect.stringContaining("Café ☕") },
    );
  });

  it("resolves a lucide icon to svg markup", async () => {
    const source = lucideSource("plane");
    iconRegistry.request([source]);
    await settle();

    const resolved = iconRegistry.getSnapshot().get(iconSourceId(source)!);
    expect(resolved?.kind).toBe("svg");
    // The registry relies on lucide markup carrying its own viewBox.
    expect(resolved?.kind === "svg" && resolved.svg).toContain("viewBox=");
  });

  it("ignores sources with no icon", () => {
    iconRegistry.request([{ kind: "none" }]);

    expect(iconRegistry.getSnapshot().size).toBe(0);
  });

  it("omits an unresolvable lucide name rather than storing a broken entry", async () => {
    const source = lucideSource("not-a-real-icon-name-xyz");
    iconRegistry.request([source]);
    await settle();

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);
  });

  // A non-svg payload sanitizes to markup that is not an svg; rendering it
  // would show a broken image rather than no icon.
  it("omits an svg data url whose payload is not an svg", () => {
    const source = svgSource(createSvgIconDataUrl("<html>Not an svg</html>"));

    iconRegistry.request([source]);

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);
  });

  // The allowlist checks only the prefix, so the payload can still be corrupt.
  it("omits an svg data url whose payload is not valid base64", () => {
    const source = svgSource("data:image/svg+xml;base64,not*base64");

    iconRegistry.request([source]);

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);
  });

  // The canvas requests on every render, and every failure left is
  // deterministic, so retrying one only repeats the work and the warning.
  it("does not retry an svg that failed to resolve", () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const source = svgSource(createSvgIconDataUrl("<html>Not an svg</html>"));

    for (let attempt = 0; attempt < 3; attempt++) {
      iconRegistry.request([source]);
    }

    expect(warn).toBeCalledTimes(1);
  });

  it("does not retry an unknown lucide name", async () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const source = lucideSource("not-a-real-icon-name-xyz");

    for (let attempt = 0; attempt < 3; attempt++) {
      iconRegistry.request([source]);
      await settle();
    }

    expect(warn).toBeCalledTimes(1);
  });

  // The whole point of the registry: identity-keyed, so N vertex types sharing
  // one icon do the work once, across every surface that asks for it.
  it("keeps one entry per unique icon no matter how often it is requested", () => {
    const url = createSvgIconDataUrl(SQUARE_SVG);

    iconRegistry.request([svgSource(url), svgSource(url)]);
    const first = iconRegistry.getSnapshot();
    iconRegistry.request([svgSource(url)]);

    expect(first.size).toBe(1);
    expect(iconRegistry.getSnapshot()).toBe(first);
  });

  it("dedupes in flight requests for the same icon", async () => {
    const listener = vi.fn();
    const unsubscribe = iconRegistry.subscribe(listener);

    iconRegistry.request([lucideSource("plane")]);
    iconRegistry.request([lucideSource("plane")]);
    await settle();

    // A second resolution would land and notify again.
    expect(listener).toBeCalledTimes(1);
    unsubscribe();
  });

  // Without this, a resolution started by one test lands in the next one.
  it("discards a resolution that lands after a reset", async () => {
    iconRegistry.request([lucideSource("plane")]);
    iconRegistry.reset();
    // Same module record as the registry's import, so once this settles the
    // registry's resolution has run too.
    await dynamicIconImports.plane();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(iconRegistry.getSnapshot().size).toBe(0);
  });

  it("notifies subscribers when an icon resolves and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = iconRegistry.subscribe(listener);

    iconRegistry.request([svgSource(createSvgIconDataUrl(SQUARE_SVG))]);
    expect(listener).toBeCalled();

    unsubscribe();
    listener.mockClear();
    iconRegistry.request([
      svgSource(createSvgIconDataUrl(`${SQUARE_SVG}<!-- b -->`)),
    ]);
    expect(listener).not.toBeCalled();
  });

  // useSyncExternalStore bails out on reference equality, so the snapshot must
  // be a NEW map when something resolved and the SAME map when nothing did.
  it("returns a stable snapshot reference until something changes", () => {
    const before = iconRegistry.getSnapshot();
    expect(iconRegistry.getSnapshot()).toBe(before);

    iconRegistry.request([svgSource(createSvgIconDataUrl(SQUARE_SVG))]);

    const after = iconRegistry.getSnapshot();
    expect(after).not.toBe(before);
    expect(iconRegistry.getSnapshot()).toBe(after);
  });
});

// Ported from the deleted renderNode.test.ts, where sanitization used to live.
// A user-supplied SVG is DOMPurify-sanitized (svg + svgFilters profiles) before
// it is stored or drawn. These pin the actual sanitizer contract: dangerous
// constructs are dropped while the surrounding drawing survives, so a hostile
// or sloppy icon degrades gracefully rather than rendering blank.
describe("sanitizes a user-supplied svg before storing it", () => {
  beforeEach(() => {
    iconRegistry.reset();
  });

  function resolveCustomSvg(svgContent: string) {
    const source = svgSource(createSvgIconDataUrl(svgContent));
    iconRegistry.request([source]);
    const resolved = iconRegistry.getSnapshot().get(iconSourceId(source)!);
    expect(resolved?.kind).toBe("svg");
    return (resolved as { kind: "svg"; svg: string }).svg;
  }

  // The svg profile already allowlists these, so no ALLOWED_ATTR override is
  // needed to keep aspect ratio. An explicit list would also be a trap: it
  // cannot take effect alongside USE_PROFILES (DOMPurify rebuilds ALLOWED_ATTR
  // from the profile sets), so it reads as load-bearing while doing nothing,
  // and any attribute it omitted would silently vanish if the profiles were
  // ever dropped.
  it("preserves the geometry and path attributes an icon needs to scale", () => {
    const svg = resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="401" height="102" viewBox="0 0 403 104" preserveAspectRatio="xMidYMid meet"><path d="M0 0h405v106H0z" stroke-width="7" transform="translate(9 9)"/><polyline points="1,1 11,11"/></svg>`,
    );

    // Distinct numbers per attribute, so a check can only pass if that
    // specific attribute-value pair survived — unlike `toContain(name)`,
    // which a substring of an unrelated attribute (`preserveAspectRatio`
    // contains "d"; `stroke-width` contains "width") can satisfy for free.
    expect(svg).toContain('width="401"');
    expect(svg).toContain('height="102"');
    expect(svg).toContain('viewBox="0 0 403 104"');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toContain('d="M0 0h405v106H0z"');
    expect(svg).toContain('stroke-width="7"');
    expect(svg).toContain('transform="translate(9 9)"');
    expect(svg).toContain('points="1,1 11,11"');
  });

  it("strips a <script> element but keeps the rest of the drawing", () => {
    const svg = resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="5" height="5"/></svg>`,
    );

    expect(svg).not.toContain("<script");
    expect(svg).toContain("<rect");
  });

  it("strips an event-handler attribute but keeps the element", () => {
    const svg = resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="5" height="5"/></svg>`,
    );

    expect(svg).not.toContain("onload");
    expect(svg).toContain("<rect");
  });

  it("strips a <foreignObject> but keeps the rest of the drawing", () => {
    const svg = resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="10" height="10"><span xmlns="http://www.w3.org/1999/xhtml">hi</span></foreignObject><rect width="5" height="5"/></svg>`,
    );

    expect(svg).not.toContain("foreignObject");
    expect(svg).toContain("<rect");
  });

  it("preserves an inline <style> element", () => {
    const svg = resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><style>.x{fill:red}</style><rect width="5" height="5"/></svg>`,
    );

    expect(svg).toContain("<style");
    expect(svg).toContain("<rect");
  });

  // The sandboxed image document is what stops the browser loading it.
  it("preserves an external <image href>", () => {
    const externalHref = "http://external.example/icon.png";
    const svg = resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><image href="${externalHref}"/><rect width="5" height="5"/></svg>`,
    );

    expect(svg).toContain(externalHref);
  });
});
