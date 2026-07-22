import type { ComponentPropsWithoutRef } from "react";

import type { EdgeStyle } from "@/core";

import { cn } from "@/utils";

import { LabelPreview } from "../LabelPreview";
import {
  type ArrowGeometry,
  type ArrowPrimitive,
  getArrowWidth,
  resolveArrowGeometry,
} from "./arrowShapes";

/**
 * Pixels per cytoscape unit. Cytoscape renders 1:1 (1 unit = 1px at zoom 1),
 * which is small for a dialog preview, so we scale up by default to land near a
 * comfortable viewing size. Everything (SVG geometry and label) scales
 * uniformly, so callers can still CSS-`zoom` from here without losing crispness.
 */
const DEFAULT_ZOOM = 2;

/** A neutral placeholder node representing an endpoint of the edge. */
function VertexPlaceholder({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-primary-subtle-hover border-primary-foreground/25 size-8 shrink-0 rounded-full border-2",
        className,
      )}
      {...props}
    />
  );
}

interface EdgePreviewProps {
  edgeStyle: EdgeStyle;
  label: string;
  className?: string;
}

/**
 * Two placeholder nodes connected by the styled edge, matching the canvas.
 */
export function EdgePreview({ edgeStyle, label, className }: EdgePreviewProps) {
  const lineWidthPx = edgeStyle.lineThickness * DEFAULT_ZOOM;
  const arrowUnit = getArrowWidth(edgeStyle.lineThickness) * DEFAULT_ZOOM;

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

  return (
    <div
      className={cn("flex w-full items-center", className)}
      role="img"
      aria-label={`${label} edge preview`}
    >
      <VertexPlaceholder />

      <div className="flex min-w-24 flex-1 items-center self-center">
        <EdgeLine
          edgeStyle={edgeStyle}
          labelText={label}
          lineWidthPx={lineWidthPx}
          sourceArrow={sourceArrow}
          targetArrow={targetArrow}
        />
      </div>

      <VertexPlaceholder />
    </div>
  );
}

// --- Edge line with arrows and label ---

function EdgeLine({
  edgeStyle,
  labelText,
  lineWidthPx,
  sourceArrow,
  targetArrow,
}: {
  edgeStyle: EdgeStyle;
  labelText: string;
  lineWidthPx: number;
  sourceArrow: ArrowGeometry | null;
  targetArrow: ArrowGeometry | null;
}) {
  // Cytoscape stops the line short of the node boundary by `gap` and places the
  // arrow tip short by `spacing`. Here "the boundary" is each node's inner edge
  // (the container's left/right). We inset the line by `gap` and anchor each
  // arrow tip `spacing` in from the boundary.
  const lineInsetLeft = sourceArrow?.gap ?? 0;
  const lineInsetRight = targetArrow?.gap ?? 0;

  // The container needs a height since every child is absolutely positioned.
  // Use the tallest arrow (or the line thickness) so vertical centering works.
  const containerHeight = Math.max(
    lineWidthPx,
    arrowHeight(sourceArrow),
    arrowHeight(targetArrow),
  );

  // The label is centered, so reserving space on the wider-reaching side must
  // be mirrored on both. Reserve twice the deepest arrow reach (plus a small
  // gap) so the centered label truncates before it touches either arrow head.
  const labelInset =
    2 * Math.max(arrowReach(sourceArrow), arrowReach(targetArrow)) + 8;

  return (
    <div className="relative w-full" style={{ height: containerHeight }}>
      {/* Line — spans the full width, inset to each arrow's gap */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: lineInsetLeft,
          right: lineInsetRight,
          borderTopWidth: lineWidthPx,
          borderTopStyle: edgeStyle.lineStyle,
          borderTopColor: edgeStyle.lineColor,
        }}
      />

      {sourceArrow && (
        <ArrowHead
          geometry={sourceArrow}
          color={edgeStyle.lineColor}
          side="source"
        />
      )}
      {targetArrow && (
        <ArrowHead
          geometry={targetArrow}
          color={edgeStyle.lineColor}
          side="target"
        />
      )}

      <LabelPreview
        labelStyle={edgeStyle}
        scale={DEFAULT_ZOOM}
        className="absolute inset-x-0 top-1/2 mx-auto -translate-y-1/2"
        style={{ maxWidth: `calc(100% - ${labelInset}px)` }}
      >
        {labelText}
      </LabelPreview>
    </div>
  );
}

function arrowHeight(geometry: ArrowGeometry | null): number {
  if (!geometry) return 0;
  return geometry.bbox.maxY - geometry.bbox.minY;
}

/**
 * How far an arrow head reaches inward from the node boundary: its tip sits
 * `spacing` in, and its body extends the bbox width further toward the center.
 */
function arrowReach(geometry: ArrowGeometry | null): number {
  if (!geometry) return 0;
  return geometry.spacing + (geometry.bbox.maxX - geometry.bbox.minX);
}

// --- Arrow head ---

/**
 * Renders a resolved arrow geometry as an absolutely-positioned SVG. The
 * arrow's tip is at cytoscape-frame origin; we position the SVG so the tip
 * lands `spacing` px in from the node boundary (the container edge).
 */
function ArrowHead({
  geometry,
  color,
  side,
}: {
  geometry: ArrowGeometry;
  color: string;
  side: "source" | "target";
}) {
  const { bbox, spacing } = geometry;
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;

  // The arrow tip is at frame origin (viewBox x=0), which sits `bbox.maxX` from
  // the SVG's right edge. To land the tip `spacing` in from the node boundary,
  // offset the SVG edge by `spacing - bbox.maxX`. (maxX is 0 for most shapes;
  // for circle/circle-triangle the shape pokes past the tip so maxX > 0.)
  const edgeOffset = spacing - bbox.maxX;
  return (
    <svg
      className="absolute top-1/2"
      viewBox={`${bbox.minX} ${bbox.minY} ${width} ${height}`}
      width={width}
      height={height}
      style={{
        [side === "target" ? "right" : "left"]: edgeOffset,
        marginTop: -height / 2,
        transform: side === "source" ? "scaleX(-1)" : undefined,
        overflow: "visible",
      }}
      fill={color}
    >
      {geometry.primitives.map((primitive, i) => (
        <ArrowPrimitiveShape key={i} primitive={primitive} />
      ))}
    </svg>
  );
}

function ArrowPrimitiveShape({ primitive }: { primitive: ArrowPrimitive }) {
  if (primitive.kind === "circle") {
    return <circle cx={primitive.cx} cy={primitive.cy} r={primitive.r} />;
  }
  if (primitive.kind === "path") {
    return <path d={primitive.d} />;
  }
  const points = primitive.points.map(([x, y]) => `${x},${y}`).join(" ");
  return <polygon points={points} />;
}
