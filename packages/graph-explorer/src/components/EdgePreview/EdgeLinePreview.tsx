import type { CSSProperties } from "react";

import type { EdgeStyle } from "@/core";

import { LabelPreview } from "../LabelPreview";
import { ArrowPrimitiveShape } from "./ArrowPrimitiveShape";
import {
  type ArrowGeometry,
  getArrowWidth,
  resolveArrowGeometry,
} from "./arrowShapes";

/**
 * Pixels per cytoscape model unit for edge previews (mirrors the vertex
 * preview's `PREVIEW_SCALE`). Cytoscape's model is ~1px per unit, too small to
 * read, so the geometry and label are drawn at this scale. A call site sizes
 * the whole preview to its surface separately (e.g. a `zoom-*` class), which
 * stays crisp because everything here is vector.
 */
const EDGE_PREVIEW_SCALE = 2;

export type EdgeLineOrientation = "horizontal" | "vertical";

/**
 * The styled edge itself — a line with a source and target arrow head — drawn
 * from the same cytoscape geometry the canvas uses, so a preview matches what
 * renders. Fills its container along the main axis (width when horizontal,
 * height when vertical); the arrows pin to the ends and the line spans between,
 * inset by cytoscape's per-arrow gap. Shared by the edge style preview
 * (horizontal, with a text label overlaid by the caller) and the edge details
 * panel (vertical).
 *
 * The arrows convey direction and style visually only, so pass an `aria-label`
 * describing the edge to expose that to assistive tech (as `VertexSymbol`
 * does); omit it when a wrapping element already provides the accessible name.
 *
 * A `label` renders a centered badge over the line in either orientation. In
 * horizontal previews it truncates so it never touches the left/right arrow
 * heads; in vertical previews the heads sit above and below, so it simply
 * centers on the line.
 */
export function EdgeLinePreview({
  edgeStyle,
  orientation,
  label,
  className,
  style,
  "aria-label": ariaLabel,
}: {
  edgeStyle: EdgeStyle;
  orientation: EdgeLineOrientation;
  label?: string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}) {
  const lineWidthPx = edgeStyle.lineThickness * EDGE_PREVIEW_SCALE;
  const arrowUnit = getArrowWidth(edgeStyle.lineThickness) * EDGE_PREVIEW_SCALE;

  const sourceArrow = resolveArrowGeometry(
    edgeStyle.sourceArrowStyle,
    arrowUnit,
    lineWidthPx,
  );
  const targetArrow = resolveArrowGeometry(
    edgeStyle.targetArrowStyle,
    arrowUnit,
    lineWidthPx,
  );

  const horizontal = orientation === "horizontal";

  // Cytoscape stops the line short of each node boundary by the arrow's `gap`.
  // Here the "boundary" is each end of this container, so inset the line by gap.
  const startGap = sourceArrow?.gap ?? 0;
  const endGap = targetArrow?.gap ?? 0;

  // Cross-axis size: the deepest arrow (or the line) so the arrows never clip.
  const crossSize = Math.max(
    lineWidthPx,
    arrowCrossSize(sourceArrow),
    arrowCrossSize(targetArrow),
  );

  // Space to keep clear on each side so a centered label truncates before it
  // touches either arrow head: the deepest reach, mirrored, plus a small gap.
  const labelInset =
    2 * Math.max(arrowReach(sourceArrow), arrowReach(targetArrow)) + 8;

  const lineStyle: CSSProperties = horizontal
    ? {
        left: startGap,
        right: endGap,
        top: "50%",
        transform: "translateY(-50%)",
        borderTopWidth: lineWidthPx,
        borderTopStyle: edgeStyle.lineStyle,
        borderTopColor: edgeStyle.lineColor,
      }
    : {
        top: startGap,
        bottom: endGap,
        left: "50%",
        transform: "translateX(-50%)",
        borderLeftWidth: lineWidthPx,
        borderLeftStyle: edgeStyle.lineStyle,
        borderLeftColor: edgeStyle.lineColor,
      };

  return (
    <div
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        ...(horizontal
          ? { width: "100%", height: crossSize }
          : { height: "100%", width: crossSize }),
        ...style,
      }}
    >
      <div style={{ position: "absolute", ...lineStyle }} />
      {sourceArrow && (
        <ArrowHead
          geometry={sourceArrow}
          color={edgeStyle.lineColor}
          side="source"
          orientation={orientation}
        />
      )}
      {targetArrow && (
        <ArrowHead
          geometry={targetArrow}
          color={edgeStyle.lineColor}
          side="target"
          orientation={orientation}
        />
      )}
      {label !== undefined && (
        <LabelPreview
          labelStyle={edgeStyle}
          scale={EDGE_PREVIEW_SCALE}
          className={
            horizontal
              ? "absolute inset-x-0 top-1/2 mx-auto -translate-y-1/2"
              : "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          }
          // Horizontal heads bound the label's width, so keep clear of them;
          // vertical heads sit above/below, so the label only needs centering.
          style={
            horizontal
              ? { maxWidth: `calc(100% - ${labelInset}px)` }
              : undefined
          }
        >
          {label}
        </LabelPreview>
      )}
    </div>
  );
}

/** How far an arrow head reaches inward from the boundary (spacing + depth). */
function arrowReach(geometry: ArrowGeometry | null): number {
  if (!geometry) {
    return 0;
  }
  return geometry.spacing + (geometry.bbox.maxX - geometry.bbox.minX);
}

/**
 * The arrow head's extent across the edge axis (its visual thickness). The
 * geometry points along X and is symmetric about it, so its thickness is the
 * Y-extent — and the head is rotated to face along the edge, so this holds for
 * either orientation.
 */
function arrowCrossSize(geometry: ArrowGeometry | null): number {
  if (!geometry) {
    return 0;
  }
  return geometry.bbox.maxY - geometry.bbox.minY;
}

type Bbox = { minX: number; minY: number; maxX: number; maxY: number };

/** Axis-aligned bounds of `bbox` after rotating by `degrees` about the origin. */
export function rotatedBbox(bbox: Bbox, degrees: number): Bbox {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners = [
    [bbox.minX, bbox.minY],
    [bbox.maxX, bbox.minY],
    [bbox.maxX, bbox.maxY],
    [bbox.minX, bbox.maxY],
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of corners) {
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }
  return { minX, minY, maxX, maxY };
}

/** How far the head points toward its node: source points back, target forward. */
function arrowAngle(
  side: "source" | "target",
  orientation: EdgeLineOrientation,
): number {
  if (orientation === "horizontal") {
    return side === "source" ? 180 : 0;
  }
  return side === "source" ? -90 : 90;
}

/**
 * A single arrow head, rotated to point along the edge toward its node and
 * positioned so its tip (the cytoscape frame origin) sits `spacing` in from the
 * container end. The rotation is baked into the SVG geometry and the viewBox is
 * sized to the rotated bounds, so the element's layout box equals its visual
 * box — letting the tip be pinned the same way in either orientation.
 */
function ArrowHead({
  geometry,
  color,
  side,
  orientation,
}: {
  geometry: ArrowGeometry;
  color: string;
  side: "source" | "target";
  orientation: EdgeLineOrientation;
}) {
  const { bbox, spacing } = geometry;
  const angle = arrowAngle(side, orientation);
  const rb = rotatedBbox(bbox, angle);
  const width = rb.maxX - rb.minX;
  const height = rb.maxY - rb.minY;

  // Center on the cross axis (`margin` = the rotated bbox's negative start), and
  // pin the tip along the main axis: the source anchors from the start, the
  // target from the end at `spacing - max`, mirroring how cytoscape places the
  // tip `spacing` in from the node boundary (matches the original preview).
  const placement: CSSProperties =
    orientation === "horizontal"
      ? {
          top: "50%",
          marginTop: rb.minY,
          ...(side === "source"
            ? { left: spacing + rb.minX }
            : { right: spacing - rb.maxX }),
        }
      : {
          left: "50%",
          marginLeft: rb.minX,
          ...(side === "source"
            ? { top: spacing + rb.minY }
            : { bottom: spacing - rb.maxY }),
        };

  return (
    <svg
      viewBox={`${rb.minX} ${rb.minY} ${width} ${height}`}
      width={width}
      height={height}
      style={{ position: "absolute", overflow: "visible", ...placement }}
      fill={color}
    >
      <g transform={`rotate(${angle})`}>
        {geometry.primitives.map((primitive, i) => (
          <ArrowPrimitiveShape key={i} primitive={primitive} />
        ))}
      </g>
    </svg>
  );
}
