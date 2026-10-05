import type { Branded } from "@/utils/branded";

import { isWellFormedString } from "@/utils/isWellFormedString";
import { getLucideName } from "@/utils/lucideIcons";

/**
 * A classified icon reference. Lucide detection wins even when `iconImageType`
 * is not svg, because the stored `lucide:` prefix is authoritative.
 */
export type IconSource =
  | { kind: "none" }
  | { kind: "raster"; url: string }
  | { kind: "lucide"; name: string }
  | { kind: "svg"; url: string };

/**
 * Icons must be either a Lucide reference or a base64-encoded `image/*` data
 * URI. Remote URLs (and any other scheme) are rejected so the icon url itself
 * is never an external reference. This does not cover references inside an
 * SVG's markup, which `sanitizeSvg` keeps. The image subtype is left open — any
 * RFC-6838-shaped subtype — rather than a fixed list, because the uploader
 * stores whatever `image/*` the browser reports (`accept="image/*"`), so a
 * closed list would reject the app's own exports on re-import. This is not a
 * weakening: SVG (the only script-capable type) is DOMPurify-sanitized at the
 * render sink regardless of the declared subtype, and every other type renders
 * as an inert raster `<img>`.
 */
const ICON_VALUE_PATTERN =
  /^(lucide:[a-z0-9-]+$|data:image\/[a-z0-9.+-]+;base64,)/;

/**
 * Whether a value passes the icon allowlist. Every write and load path shares
 * this one gate so the accepted set cannot drift. A lone surrogate is rejected
 * too: `encodeURIComponent` throws on one during style computation.
 */
export function isAllowedIconValue(value: string): boolean {
  return ICON_VALUE_PATTERN.test(value) && isWellFormedString(value);
}

/** Identity of an icon, independent of the color any vertex type renders it in. */
export type IconSourceId = Branded<string, "IconSourceId">;

export function classifyIconSource(input: {
  iconUrl: string;
  iconImageType: string;
}): IconSource {
  const { iconUrl, iconImageType } = input;
  if (!iconUrl) {
    return { kind: "none" };
  }
  const lucideName = getLucideName(iconUrl);
  if (lucideName) {
    return { kind: "lucide", name: lucideName };
  }
  if (iconImageType === "image/svg+xml") {
    return { kind: "svg", url: iconUrl };
  }
  return { kind: "raster", url: iconUrl };
}

/** Dedup key for a source; `null` means "no icon, nothing to resolve". */
export function iconSourceId(source: IconSource): IconSourceId | null {
  switch (source.kind) {
    case "none":
      return null;
    case "raster":
      return `raster:${source.url}` as IconSourceId;
    case "lucide":
      return `lucide:${source.name}` as IconSourceId;
    case "svg":
      return `svg:${source.url}` as IconSourceId;
  }
}
