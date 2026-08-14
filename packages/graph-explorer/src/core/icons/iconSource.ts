import type { Branded } from "@/utils/branded";

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
