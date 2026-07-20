import type React from "react";

import Color from "color";

import type { LabelVisualStyle } from "@/core";

import { cn } from "@/utils";

/**
 * Cytoscape model-unit constants for label rendering.
 * Matches defaultNodeStyle.ts and defaultEdgeStyle.ts.
 */
const FONT_SIZE = 7;
const PADDING = 2;
const BORDER_RADIUS = 2;

interface LabelPreviewProps {
  /** The label text to display. */
  children: string;
  /** The label visual style (colors, border, opacity). */
  labelStyle: LabelVisualStyle;
  /**
   * Scale factor: model units → pixels.
   * (e.g., 2 means 1 model unit = 2px, rendering font at 14px)
   */
  scale: number;
  className?: string;
  /** Additional inline styles (e.g., max-width constraints). */
  style?: React.CSSProperties;
}

/**
 * A label badge preview that faithfully matches cytoscape's canvas rendering
 * at any scale. Text color is derived from `labelColor` darkness (white on dark,
 * black on light) — same logic as `useGraphStyles.ts`.
 *
 * Used for both vertex and edge label previews.
 */
export function LabelPreview({
  children,
  labelStyle,
  scale,
  className,
  style: styleProp,
}: LabelPreviewProps) {
  return (
    <span
      className={cn(
        "block w-fit max-w-full overflow-hidden text-center leading-none font-medium text-ellipsis whitespace-nowrap",
        className,
      )}
      style={{
        fontSize: FONT_SIZE * scale,
        padding: PADDING * scale,
        borderRadius: BORDER_RADIUS * scale,
        color: new Color(labelStyle.labelColor).isDark()
          ? "#ffffff"
          : "#000000",
        backgroundColor: `color-mix(in srgb, ${labelStyle.labelColor} ${labelStyle.labelBackgroundOpacity * 100}%, transparent)`,
        borderWidth: labelStyle.labelBorderWidth * scale || undefined,
        borderStyle:
          labelStyle.labelBorderWidth > 0
            ? labelStyle.labelBorderStyle
            : undefined,
        borderColor:
          labelStyle.labelBorderWidth > 0
            ? labelStyle.labelBorderColor
            : undefined,
        ...styleProp,
      }}
    >
      {children}
    </span>
  );
}
