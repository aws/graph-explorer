import { describe, expect, test } from "vite-plus/test";

import {
  checkLinks,
  deriveBasePath,
  findHrefs,
  hasExternalScheme,
  toPageUrl,
  withTrailingSlash,
} from "./linkCheck.ts";

const base = "/graph-explorer";

function page(canonicalPath: string, body: string): string {
  return `<html><head><link rel="canonical" href="https://aws.github.io${canonicalPath}"/></head><body>${body}</body></html>`;
}

/** A minimal two-page site: a features index and a settings page with a #styles anchor. */
function site(indexBody: string, settingsBody = ""): Map<string, string> {
  return new Map([
    ["features/index.html", page(`${base}/features/`, indexBody)],
    [
      "features/settings/index.html",
      page(
        `${base}/features/settings/`,
        `<h2 id="styles">Styles</h2>${settingsBody}`,
      ),
    ],
  ]);
}

const filePaths = [
  "features/index.html",
  "features/settings/index.html",
  "logo.png",
];

function broken(href: string, reason: string, source = `${base}/features/`) {
  return [{ source, href, reason }];
}

describe("checkLinks", () => {
  test("accepts a relative link to a sibling page", () => {
    const report = checkLinks(site(`<a href="./settings/">go</a>`), filePaths);

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
    expect(report.pages).toBe(2);
  });

  test("accepts a relative link to an existing anchor", () => {
    const report = checkLinks(
      site(`<a href="./settings/#styles">go</a>`),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("reports a relative link to a missing anchor", () => {
    const report = checkLinks(
      site(`<a href="./settings/#nope">go</a>`),
      filePaths,
    );

    expect(report.broken).toStrictEqual(
      broken("./settings/#nope", "missing anchor #nope"),
    );
  });

  test("reports a relative link to a missing page", () => {
    const report = checkLinks(site(`<a href="./nope/">go</a>`), filePaths);

    expect(report.broken).toStrictEqual(
      broken("./nope/", `missing page ${base}/features/nope/`),
    );
  });

  test("resolves a root-absolute link that carries the base path", () => {
    const report = checkLinks(
      site(`<a href="${base}/features/settings/#styles">go</a>`),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("reports a root-absolute link that omits the base path", () => {
    const report = checkLinks(
      site(`<a href="/features/settings/">go</a>`),
      filePaths,
    );

    expect(report.broken).toStrictEqual(
      broken("/features/settings/", "missing page /features/settings/"),
    );
  });

  test("walks up out of a nested page", () => {
    const report = checkLinks(site("", `<a href="../">up</a>`), filePaths);

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("accepts a link to a non-page asset", () => {
    const report = checkLinks(
      site(`<a href="${base}/logo.png">logo</a>`),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("skips links to another host without counting them", () => {
    const report = checkLinks(
      site(
        `<a href="https://example.com">a</a><a href="mailto:x@example.com">b</a><a href="//cdn.example.com/x">d</a>`,
      ),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(0);
  });

  test("validates a fragment pointing at the containing page", () => {
    const pages = site(`<a href="#styles">a</a><a href="#nope">b</a>`);
    pages.set(
      "features/index.html",
      page(
        `${base}/features/`,
        `<h2 id="styles">S</h2><a href="#styles">a</a><a href="#nope">b</a>`,
      ),
    );

    const report = checkLinks(pages, filePaths);

    expect(report.broken).toStrictEqual(
      broken("#nope", "missing anchor #nope"),
    );
    expect(report.checked).toBe(2);
  });

  test("treats an empty href as the containing page", () => {
    const report = checkLinks(site(`<a href="">here</a>`), filePaths);

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("reports a malformed fragment instead of throwing", () => {
    const report = checkLinks(
      site(`<a href="./settings/#%zz">go</a>`),
      filePaths,
    );

    expect(report.broken).toStrictEqual(
      broken("./settings/#%zz", "malformed fragment #%zz"),
    );
  });

  test("matches an anchor written with percent encoding", () => {
    const pages = new Map([
      ["index.html", page(`${base}/`, `<a href="./guide/#a%20b">go</a>`)],
      ["guide/index.html", page(`${base}/guide/`, `<h2 id="a b">A B</h2>`)],
    ]);

    const report = checkLinks(pages, [...pages.keys()]);

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("accepts an image and an icon that exist", () => {
    const report = checkLinks(
      site(
        `<img src="${base}/logo.png" alt="">` +
          `<link rel="icon" href="${base}/logo.png">`,
      ),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(2);
  });

  test("reports an image that is missing", () => {
    const report = checkLinks(
      site(`<img alt="" src="${base}/missing.png">`),
      filePaths,
    );

    expect(report.broken).toStrictEqual(
      broken(`${base}/missing.png`, `missing page ${base}/missing.png`),
    );
  });

  test.each(["icon", "shortcut icon"])(
    "reports a %s link that is missing",
    rel => {
      const report = checkLinks(
        site(`<link rel="${rel}" href="${base}/favicon.svg">`),
        filePaths,
      );

      expect(report.broken).toStrictEqual(
        broken(`${base}/favicon.svg`, `missing page ${base}/favicon.svg`),
      );
    },
  );

  test("skips an image hosted on another host", () => {
    const report = checkLinks(
      site(`<img src="https://example.com/x.png" alt="">`),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(0);
  });

  test("does not check a stylesheet link", () => {
    const report = checkLinks(
      site(`<link rel="stylesheet" href="${base}/missing.css">`),
      filePaths,
    );

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(0);
  });

  test("reports a link naming a directory that has no page", () => {
    const report = checkLinks(site(`<a href="${base}/assets">x</a>`), [
      ...filePaths,
      "assets/app.css",
    ]);

    expect(report.broken).toStrictEqual(
      broken(`${base}/assets`, `missing page ${base}/assets/`),
    );
  });

  test("resolves a page slug containing a dot", () => {
    const pages = new Map([
      ["index.html", page(`${base}/`, `<a href="./v3.2.2">go</a>`)],
      ["v3.2.2/index.html", page(`${base}/v3.2.2/`, "<p>notes</p>")],
    ]);

    const report = checkLinks(pages, [...pages.keys()]);

    expect(report.broken).toStrictEqual([]);
    expect(report.checked).toBe(1);
  });

  test("ignores a data-id attribute when collecting anchors", () => {
    const pages = site(`<a href="./settings/#widget">go</a>`);
    pages.set(
      "features/settings/index.html",
      page(`${base}/features/settings/`, `<div data-id="widget"></div>`),
    );

    const report = checkLinks(pages, filePaths);

    expect(report.broken).toStrictEqual(
      broken("./settings/#widget", "missing anchor #widget"),
    );
  });
});

describe("deriveBasePath", () => {
  test("recovers the base path from a nested page", () => {
    expect(deriveBasePath(site(""))).toBe(base);
  });

  test("recovers an empty base path when the site is served at the root", () => {
    const pages = new Map([["features/index.html", page("/features/", "")]]);

    expect(deriveBasePath(pages)).toBe("");
  });

  test("ignores the root page, whose canonical would match any base", () => {
    const pages = new Map([
      ["index.html", page("/wrong/", "")],
      ["features/index.html", page(`${base}/features/`, "")],
    ]);

    expect(deriveBasePath(pages)).toBe(base);
  });

  test("throws when no page carries a canonical link", () => {
    const pages = new Map([["index.html", "<html></html>"]]);

    expect(() => deriveBasePath(pages)).toThrow(
      new Error("No canonical link found, so the base path is unknown."),
    );
  });
});

describe("toPageUrl", () => {
  test.each([
    ["index.html", "/"],
    ["features/index.html", "/features/"],
    ["features/settings/index.html", "/features/settings/"],
    ["sitemap.xml", "/sitemap.xml"],
  ])("maps %s to %s", (path, expected) => {
    expect(toPageUrl(path, "")).toBe(expected);
  });

  test("prefixes the base path", () => {
    expect(toPageUrl("features/index.html", base)).toBe(`${base}/features/`);
  });
});

describe("withTrailingSlash", () => {
  test.each([
    ["/features", "/features/"],
    ["/features/", "/features/"],
    ["/logo.png", "/logo.png"],
    ["/", "/"],
  ])("normalizes %s to %s", (pathname, expected) => {
    expect(withTrailingSlash(pathname)).toBe(expected);
  });
});

describe("hasExternalScheme", () => {
  test.each([
    "https://example.com",
    "http://localhost:8080/explorer",
    "mailto:someone@example.com",
    "//cdn.example.com/x",
  ])("treats %s as off-site", href => {
    expect(hasExternalScheme(href)).toBe(true);
  });

  test.each([
    "./settings/",
    "../",
    "/graph-explorer/features/",
    "settings/",
    "#anchor",
    "",
  ])("treats %s as on-site", href => {
    expect(hasExternalScheme(href)).toBe(false);
  });
});

describe("findHrefs", () => {
  test("collects hrefs and decodes escaped ampersands", () => {
    const html = `<a class="x" href="./a/">A</a><a href="./b/?x=1&amp;y=2">B</a>`;

    expect(findHrefs(html)).toStrictEqual(["./a/", "./b/?x=1&y=2"]);
  });

  test("ignores href attributes on other elements", () => {
    const html = `<link rel="stylesheet" href="./styles.css"><area href="./map/"><a href="./a/">A</a>`;

    expect(findHrefs(html)).toStrictEqual(["./a/"]);
  });

  test("does not mistake data-href for href", () => {
    const html = `<a href="real/" data-href="fake/">A</a>`;

    expect(findHrefs(html)).toStrictEqual(["real/"]);
  });

  test("reads a single-quoted href", () => {
    expect(findHrefs(`<a href='real/'>A</a>`)).toStrictEqual(["real/"]);
  });

  test("reads an href after a newline", () => {
    expect(findHrefs('<a\n  href="real/">A</a>')).toStrictEqual(["real/"]);
  });

  test("reads an uppercase tag and attribute", () => {
    expect(findHrefs('<A HREF="real/">A</A>')).toStrictEqual(["real/"]);
  });

  test("is not truncated by an angle bracket inside an attribute value", () => {
    const html = `<a title="a > b" href="real/">A</a>`;

    expect(findHrefs(html)).toStrictEqual(["real/"]);
  });
});
