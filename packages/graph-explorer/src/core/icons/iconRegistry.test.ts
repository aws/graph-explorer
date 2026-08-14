// @vitest-environment jsdom

// DEV NOTE: happy-dom's DOMParser is not reliable for the svg render path.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { iconRegistry } from "./iconRegistry";
import { classifyIconSource, iconSourceId } from "./iconSource";

const REMOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>`;

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
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(REMOTE_SVG))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts with an empty snapshot", () => {
    expect(iconRegistry.getSnapshot().size).toBe(0);
  });

  it("resolves a raster icon to its url without fetching", async () => {
    const source = classifyIconSource({
      iconUrl: "https://example.test/a.png",
      iconImageType: "image/png",
    });
    iconRegistry.request([source]);
    await settle();

    expect(iconRegistry.getSnapshot().get(iconSourceId(source)!)).toStrictEqual(
      {
        kind: "raster",
        url: "https://example.test/a.png",
      },
    );
    expect(fetch).not.toBeCalled();
  });

  // A url needs no resolution, so making the consumer wait a render for it
  // would be a pointless async round trip.
  it("resolves a raster icon synchronously", () => {
    const source = classifyIconSource({
      iconUrl: "https://example.test/a.png",
      iconImageType: "image/png",
    });

    iconRegistry.request([source]);

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(true);
    expect(iconRegistry.pendingCount).toBe(0);
  });

  it("fetches and sanitizes a remote svg", async () => {
    const source = svgSource("https://example.test/a.svg");
    iconRegistry.request([source]);
    await settle();

    const resolved = iconRegistry.getSnapshot().get(iconSourceId(source)!);
    expect(resolved?.kind).toBe("svg");
    expect(resolved).toMatchObject({ svg: expect.stringContaining("<path") });
    expect(fetch).toBeCalledTimes(1);
  });

  it("resolves a lucide icon to svg markup without fetching", async () => {
    const source = lucideSource("plane");
    iconRegistry.request([source]);
    await settle();

    const resolved = iconRegistry.getSnapshot().get(iconSourceId(source)!);
    expect(resolved?.kind).toBe("svg");
    expect(fetch).not.toBeCalled();
  });

  it("ignores sources with no icon", async () => {
    iconRegistry.request([{ kind: "none" }]);
    await settle();

    expect(iconRegistry.getSnapshot().size).toBe(0);
  });

  it("omits an unresolvable lucide name rather than storing a broken entry", async () => {
    const source = lucideSource("not-a-real-icon-name-xyz");
    iconRegistry.request([source]);
    await settle();

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);
  });

  // The whole point of the registry: identity-keyed, so N vertex types sharing
  // one icon do the work once, across every surface that asks for it.
  it("resolves each unique icon exactly once no matter how often it is requested", async () => {
    const source = svgSource("https://example.test/a.svg");

    iconRegistry.request([source, source, source]);
    iconRegistry.request([svgSource("https://example.test/a.svg")]);
    await settle();
    iconRegistry.request([source]);
    await settle();

    expect(fetch).toBeCalledTimes(1);
  });

  it("dedupes in flight requests for the same icon", async () => {
    let release!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(resolve => (release = resolve))),
    );

    iconRegistry.request([svgSource("https://example.test/slow.svg")]);
    iconRegistry.request([svgSource("https://example.test/slow.svg")]);

    expect(fetch).toBeCalledTimes(1);
    release(new Response(REMOTE_SVG));
    await settle();
  });

  // A failed fetch must NOT be cached, or a transient network blip would
  // permanently blank an icon for the life of the page.
  it("retries a failed icon on the next request", async () => {
    const failing = vi.fn(() => Promise.reject(new Error("network down")));
    vi.stubGlobal("fetch", failing);

    const source = svgSource("https://example.test/flaky.svg");
    iconRegistry.request([source]);
    await settle();

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(REMOTE_SVG))),
    );
    iconRegistry.request([source]);
    await settle();

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(true);
  });

  // Bounded, so a permanently broken icon stops re-fetching on every render.
  it("stops retrying a failed icon after three attempts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );
    const source = svgSource("https://example.test/broken.svg");

    for (let attempt = 0; attempt < 5; attempt++) {
      iconRegistry.request([source]);
      await settle();
    }

    expect(fetch).toBeCalledTimes(3);
  });

  // A 404 body sanitizes to markup that is not an svg; rendering it would show
  // a broken image rather than no icon.
  it("rejects a response that is not svg", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("<html>Not Found</html>"))),
    );
    const source = svgSource("https://example.test/missing.svg");

    iconRegistry.request([source]);
    await settle();

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);
  });

  // `fetch` does not reject on 404, so this failure never throws. It still has
  // to be counted, or the icon re-fetches on every render forever.
  it("stops retrying a 404 after three attempts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("<html>Not Found</html>"))),
    );
    const source = svgSource("https://example.test/missing.svg");

    for (let attempt = 0; attempt < 5; attempt++) {
      iconRegistry.request([source]);
      await settle();
    }

    expect(fetch).toBeCalledTimes(3);
  });

  it("stops retrying an unknown lucide name after three attempts", async () => {
    const source = lucideSource("not-a-real-icon-name-xyz");

    for (let attempt = 0; attempt < 5; attempt++) {
      iconRegistry.request([source]);
      await settle();
    }

    expect(iconRegistry.getSnapshot().has(iconSourceId(source)!)).toBe(false);
  });

  // Without this, a resolution started by one test lands in the next one.
  it("discards a resolution that lands after a reset", async () => {
    let release!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(resolve => (release = resolve))),
    );
    const source = svgSource("https://example.test/slow.svg");

    iconRegistry.request([source]);
    iconRegistry.reset();
    release(new Response(REMOTE_SVG));
    await vi.waitFor(() => expect(fetch).toBeCalledTimes(1));

    expect(iconRegistry.getSnapshot().size).toBe(0);
  });

  it("notifies subscribers when an icon resolves and stops after unsubscribe", async () => {
    const listener = vi.fn();
    const unsubscribe = iconRegistry.subscribe(listener);

    iconRegistry.request([svgSource("https://example.test/a.svg")]);
    await settle();
    expect(listener).toBeCalled();

    unsubscribe();
    listener.mockClear();
    iconRegistry.request([svgSource("https://example.test/b.svg")]);
    await settle();
    expect(listener).not.toBeCalled();
  });

  // useSyncExternalStore bails out on reference equality, so the snapshot must
  // be a NEW map when something resolved and the SAME map when nothing did.
  it("returns a stable snapshot reference until something changes", async () => {
    const before = iconRegistry.getSnapshot();
    expect(iconRegistry.getSnapshot()).toBe(before);

    iconRegistry.request([svgSource("https://example.test/a.svg")]);
    await settle();

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function resolveCustomSvg(svgContent: string) {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(svgContent))),
    );
    const source = svgSource("https://example.test/custom.svg");
    iconRegistry.request([source]);
    await vi.waitFor(() => expect(iconRegistry.pendingCount).toBe(0));
    const resolved = iconRegistry.getSnapshot().get(iconSourceId(source)!);
    expect(resolved?.kind).toBe("svg");
    return (resolved as { kind: "svg"; svg: string }).svg;
  }

  it("strips a <script> element but keeps the rest of the drawing", async () => {
    const svg = await resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="5" height="5"/></svg>`,
    );

    expect(svg).not.toContain("<script");
    expect(svg).toContain("<rect");
  });

  it("strips an event-handler attribute but keeps the element", async () => {
    const svg = await resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="5" height="5"/></svg>`,
    );

    expect(svg).not.toContain("onload");
    expect(svg).toContain("<rect");
  });

  it("strips a <foreignObject> but keeps the rest of the drawing", async () => {
    const svg = await resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="10" height="10"><span xmlns="http://www.w3.org/1999/xhtml">hi</span></foreignObject><rect width="5" height="5"/></svg>`,
    );

    expect(svg).not.toContain("foreignObject");
    expect(svg).toContain("<rect");
  });

  it("preserves an inline <style> element", async () => {
    const svg = await resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><style>.x{fill:red}</style><rect width="5" height="5"/></svg>`,
    );

    expect(svg).toContain("<style");
    expect(svg).toContain("<rect");
  });

  it("preserves an external <image href> without fetching it", async () => {
    const externalHref = "http://external.example/icon.png";
    const svg = await resolveCustomSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><image href="${externalHref}"/><rect width="5" height="5"/></svg>`,
    );

    expect(svg).toContain(externalHref);
    // Only the icon itself is fetched; the sandbox is what stops the browser
    // loading the nested reference.
    expect(fetch).toBeCalledTimes(1);
    expect(fetch).not.toBeCalledWith(externalHref);
  });
});
