import type { SVGAttributes } from "react";

import { ARROW_STYLES, type ArrowStyle } from "@/core";

import { ArrowPrimitiveShape } from "./ArrowPrimitiveShape";
import {
  type ArrowGeometry,
  getArrowWidth,
  resolveArrowGeometry,
} from "./arrowShapes";

// --- Icon geometry ---
//
// An arrow-style icon is a short horizontal edge ending in the arrow head, all
// drawn from the same cytoscape geometry the canvas and edge preview use. The
// three visual invariants across every style:
//   1. the edge line STARTS at a shared left edge,
//   2. the head's TRAILING edge lands on a shared right anchor (x=0), and
//   3. every icon shares one viewBox, so line thickness and zoom are identical.
// Line LENGTH therefore varies with how deep the head is.

/** Conceptual edge width the icon geometry is drawn at. */
const LINE_THICKNESS = 2;
/** Pixels per cytoscape unit — the multiplier applied to normalized points. */
const UNIT = getArrowWidth(LINE_THICKNESS);
/** Shaft length beyond the leftmost head body, as a fraction of the unit. */
const SHAFT_FRACTION = 0.12;
/** Padding around the drawn content, in cytoscape units. */
const PADDING = 3;

/** Shift that lands a head's rightmost point on the shared right anchor (0). */
function headShift(geometry: ArrowGeometry | null): number {
  return geometry ? -geometry.bbox.maxX : 0;
}

/**
 * The viewBox and shaft-start shared by every arrow-style icon, computed once
 * from the union of all head geometries so the icons form a consistent set.
 */
function computeSharedFrame() {
  let bodyMinX = 0;
  let yExtent = LINE_THICKNESS / 2;
  for (const style of ARROW_STYLES) {
    const geometry = resolveArrowGeometry(style, UNIT, LINE_THICKNESS);
    if (!geometry) {
      continue;
    }
    const shift = headShift(geometry);
    bodyMinX = Math.min(bodyMinX, geometry.bbox.minX + shift);
    yExtent = Math.max(yExtent, -geometry.bbox.minY, geometry.bbox.maxY);
  }
  const shaftLeft = bodyMinX - UNIT * SHAFT_FRACTION;
  const minX = shaftLeft - PADDING;
  const maxX = PADDING;
  const minY = -(yExtent + PADDING);
  const height = 2 * (yExtent + PADDING);
  return {
    shaftLeft,
    viewBox: `${minX} ${minY} ${maxX - minX} ${height}`,
  };
}

const sharedFrame = computeSharedFrame();

export type ArrowStyleIconProps = {
  arrowStyle: ArrowStyle;
} & SVGAttributes<SVGSVGElement>;

/**
 * Icon for an edge arrow style: a short edge line ending in the arrow head,
 * drawn from the same cytoscape geometry as the canvas so the picker and edge
 * details always match what renders. The head points right; rotate with CSS to
 * reorient. Fills with `currentColor`, so it takes the surrounding text color.
 */
export function ArrowStyleIcon({ arrowStyle, ...props }: ArrowStyleIconProps) {
  const geometry = resolveArrowGeometry(arrowStyle, UNIT, LINE_THICKNESS);
  const shift = headShift(geometry);
  // The shaft meets the head at cytoscape's (spacing - gap) point, in the
  // shifted frame; with no head it runs to the shared right anchor at x=0.
  const shaftRight = geometry ? geometry.spacing - geometry.gap + shift : 0;

  return (
    <svg
      width="1em"
      height="1em"
      viewBox={sharedFrame.viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x={sharedFrame.shaftLeft}
        y={-LINE_THICKNESS / 2}
        width={shaftRight - sharedFrame.shaftLeft}
        height={LINE_THICKNESS}
      />
      {geometry && (
        <g transform={`translate(${shift} 0)`}>
          {geometry.primitives.map((primitive, i) => (
            <ArrowPrimitiveShape key={i} primitive={primitive} />
          ))}
        </g>
      )}
    </svg>
  );
}
