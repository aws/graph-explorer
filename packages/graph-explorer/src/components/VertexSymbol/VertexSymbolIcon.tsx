import { DynamicIcon } from "lucide-react/dynamic";

import type { VertexStyle } from "@/core";

import {
  classifyIconSource,
  type IconSource,
  toIconImageUrl,
  useResolvedIcon,
} from "@/core/icons";
import { isValidLucideIconName } from "@/utils/lucideIcons";

/** Offset and size in the parent svg's user units. */
interface Placement {
  x: number;
  y: number;
  size: number;
}

/**
 * Draws a vertex icon inside the parent `<svg>`.
 *
 * The caller must put the clip on an ancestor `<g>`: Chrome renders nothing
 * when `clip-path` sits on a nested `<svg>`.
 * See docs/adr/20260813-icon-registry-not-react-query.md.
 */
export function VertexSymbolIcon({
  vertexStyle,
  ...placement
}: { vertexStyle: VertexStyle } & Placement) {
  const source = classifyIconSource(vertexStyle);

  switch (source.kind) {
    case "none":
      return null;
    case "lucide":
      return (
        <LucideIcon
          name={source.name}
          color={vertexStyle.color}
          {...placement}
        />
      );
    case "raster":
    case "svg":
      return (
        <ImageIcon source={source} color={vertexStyle.color} {...placement} />
      );
  }
}

/**
 * Lucide markup is trusted bundled geometry, so it renders as live DOM and
 * inherits the vertex color through `currentColor` — no fetch, no data uri, and
 * recoloring costs nothing.
 */
function LucideIcon({
  name,
  color,
  x,
  y,
  size,
}: { name: string; color: string } & Placement) {
  if (!isValidLucideIconName(name)) {
    return null;
  }
  return (
    <DynamicIcon
      name={name}
      x={x}
      y={y}
      width={size}
      height={size}
      style={{ color }}
    />
  );
}

/**
 * `<image>` renders its source as a separate script-disabled image document.
 * That sandbox is why untrusted SVG is not inlined, and also why CSS cannot
 * reach it, so the color has to be baked in.
 */
function ImageIcon({
  source,
  color,
  x,
  y,
  size,
}: {
  source: Extract<IconSource, { kind: "raster" | "svg" }>;
  color: string;
} & Placement) {
  const resolved = useResolvedIcon(source);
  if (!resolved) {
    return null;
  }
  return (
    <image
      href={toIconImageUrl(resolved, color)}
      x={x}
      y={y}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
