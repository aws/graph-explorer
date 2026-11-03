/**
 * Resolves and validates the internal links, images, and icons of a built docs site.
 *
 * Starlight's own links validator cannot cover this site: it refuses relative
 * links rather than resolving them, and it never inspects custom pages under
 * src/pages. This works on built HTML instead, so it covers both.
 *
 * External links are out of scope. Anything carrying a scheme is skipped, so a
 * dead URL on another host will not be reported here.
 *
 * Everything here is pure. The caller supplies the built files, so the logic is
 * testable without a real build.
 */

/** Built HTML keyed by path relative to the output directory. */
export type BuiltPages = ReadonlyMap<string, string>;

export type BrokenLink = {
  source: string;
  href: string;
  reason: string;
};

export type LinkReport = {
  checked: number;
  pages: number;
  broken: BrokenLink[];
};

type SiteIndex = {
  /** Anchor ids per page URL. */
  pageAnchors: Map<string, Set<string>>;
  /** URLs of non-page files the build emitted. */
  fileUrls: Set<string>;
};

const resolutionOrigin = "https://docs.invalid";

/**
 * @param pages built HTML, keyed by output-relative path
 * @param outputFilePaths every *file* the build emitted, output-relative.
 *   Directories must be excluded, or a link naming a directory with no
 *   index.html would resolve against it and pass.
 */
export function checkLinks(
  pages: BuiltPages,
  outputFilePaths: Iterable<string>,
): LinkReport {
  const base = deriveBasePath(pages);
  const index = buildSiteIndex(pages, outputFilePaths, base);
  const broken: BrokenLink[] = [];
  let checked = 0;

  for (const [path, html] of pages) {
    const source = toPageUrl(path, base);
    for (const href of [...findHrefs(html), ...findAssetRefs(html)]) {
      if (hasExternalScheme(href)) {
        continue;
      }
      checked++;
      const reason = findBrokenReason(href, source, index);
      if (reason) {
        broken.push({ source, href, reason });
      }
    }
  }

  return { checked, pages: pages.size, broken };
}

/**
 * Recovers the configured `base` by comparing a page's canonical URL against
 * its location in the output, so this never restates astro.config.mjs.
 */
export function deriveBasePath(pages: BuiltPages): string {
  for (const [path, html] of pages) {
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    if (!canonical) {
      continue;
    }
    const canonicalPath = new URL(canonical).pathname;
    const suffix = toPageUrl(path, "");
    // Every canonical path ends in "/", so the root page's suffix would match
    // anything and derive a wrong base. Take it from a nested page instead.
    if (suffix !== "/" && canonicalPath.endsWith(suffix)) {
      return canonicalPath.slice(0, canonicalPath.length - suffix.length);
    }
  }
  throw new Error("No canonical link found, so the base path is unknown.");
}

export function toPageUrl(path: string, base: string): string {
  return base + "/" + path.replace(/(^|\/)index\.html$/, "$1");
}

export function hasExternalScheme(href: string): boolean {
  return href.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(href);
}

/**
 * Collects anchor hrefs. Matches each `<a>` tag first, then reads its `href`,
 * so `data-href` cannot be mistaken for `href` and a `>` inside a quoted
 * attribute value does not truncate the tag.
 */
export function findHrefs(html: string): string[] {
  return findAttributeValues(html, "a", "href");
}

/**
 * Collects the files a page loads for display: `<img src>` and the `href` of
 * an icon `<link>`, whether its `rel` is `icon` or `shortcut icon`.
 */
export function findAssetRefs(html: string): string[] {
  const icons = tagsNamed(html, "link")
    .filter(tag =>
      readAttribute(tag, "rel")?.toLowerCase().split(/\s+/).includes("icon"),
    )
    .flatMap(tag => readAttribute(tag, "href") ?? []);
  return [...findAttributeValues(html, "img", "src"), ...icons];
}

function findAttributeValues(
  html: string,
  tagName: string,
  attribute: string,
): string[] {
  return tagsNamed(html, tagName).flatMap(
    tag => readAttribute(tag, attribute) ?? [],
  );
}

function tagsNamed(html: string, tagName: string): string[] {
  const tags = html.matchAll(
    new RegExp(`<${tagName}\\s(?:"[^"]*"|'[^']*'|[^>"'])*>`, "gi"),
  );
  return Array.from(tags, ([tag]) => tag);
}

function readAttribute(tag: string, attribute: string): string | undefined {
  const match = new RegExp(
    `(?:^|\\s)${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(tag);
  const value = match?.[1] ?? match?.[2] ?? match?.[3];
  return value?.replace(/&amp;/g, "&");
}

function buildSiteIndex(
  pages: BuiltPages,
  outputFilePaths: Iterable<string>,
  base: string,
): SiteIndex {
  const pageAnchors = new Map<string, Set<string>>();
  for (const [path, html] of pages) {
    // Require leading whitespace so `data-id` does not contribute an anchor.
    const ids = html.matchAll(/\sid="([^"]+)"/g);
    pageAnchors.set(
      toPageUrl(path, base),
      new Set(Array.from(ids, match => match[1])),
    );
  }
  const fileUrls = new Set(
    Array.from(outputFilePaths, path => base + "/" + path),
  );
  return { pageAnchors, fileUrls };
}

function findBrokenReason(
  href: string,
  source: string,
  index: SiteIndex,
): string | undefined {
  const resolved = new URL(href, new URL(source, resolutionOrigin));

  // Resolve against pages before files, so a real page always wins over a
  // same-named emitted file. Both path forms are tried regardless of whether the
  // last segment looks like a filename, so a dotted slug like /v3.2.2 resolves.
  const anchors =
    index.pageAnchors.get(resolved.pathname) ??
    (resolved.pathname.endsWith("/")
      ? undefined
      : index.pageAnchors.get(resolved.pathname + "/"));
  if (anchors) {
    const fragment = decodeFragment(resolved.hash);
    if (fragment === undefined) {
      return `malformed fragment ${resolved.hash}`;
    }
    return fragment && !anchors.has(fragment)
      ? `missing anchor #${fragment}`
      : undefined;
  }
  if (index.fileUrls.has(resolved.pathname)) {
    return undefined;
  }
  return `missing page ${withTrailingSlash(resolved.pathname)}`;
}

/** Astro serves directory-style URLs, so a path without a file extension is a directory. */
export function withTrailingSlash(pathname: string): string {
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  return pathname.endsWith("/") || lastSegment.includes(".")
    ? pathname
    : pathname + "/";
}

/** Returns undefined for a malformed escape, so a bad href is reported rather than thrown. */
function decodeFragment(hash: string): string | undefined {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return undefined;
  }
}
