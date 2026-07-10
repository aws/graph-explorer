import { useId } from "react";

import { useVertexStyle, type VertexStyle, type VertexType } from "@/core";
import { cn } from "@/utils";

import { resolveShapeGeometry } from "./nodeShapes";
import { useIconDataUrl } from "./useIconDataUrl";

const VIEWBOX = 96;
const ICON_RATIO = 0.6;
const CANVAS_NODE_SIZE = 24;
const BORDER_SCALE = VIEWBOX / CANVAS_NODE_SIZE;

interface Props {
  vertexStyle: VertexStyle;
  className?: string;
}

export function VertexSymbol({ vertexStyle, className }: Props) {
  const iconDataUrl = useIconDataUrl(vertexStyle);
  // SVG url(#...) references reject the colons in React's raw useId format.
  const clipId = `vs-${useId().replace(/:/g, "")}`;
  const strokeWidth = vertexStyle.borderWidth * BORDER_SCALE;
  const insetSize = Math.max(1, VIEWBOX - strokeWidth * 2);
  const geometry = resolveShapeGeometry(vertexStyle.shape, insetSize);

  const iconSize = VIEWBOX * ICON_RATIO;
  const iconOffset = (VIEWBOX - iconSize) / 2;

  // The shape is rendered twice: once filled/stroked, once as the icon's
  // clipPath. clipPath children must be shape elements directly — a wrapping
  // <g> is ignored by the spec and yields an empty clip — so the inset
  // transform is carried by the shape element itself.
  const transform = `translate(${strokeWidth} ${strokeWidth})`;
  const shapeEl = renderShape(geometry, insetSize, transform);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={cn("size-9 shrink-0", className)}
      role="img"
      aria-label={`${vertexStyle.displayLabel ?? vertexStyle.type} symbol`}
    >
      <defs>
        <clipPath id={clipId}>{shapeEl}</clipPath>
      </defs>
      <g
        fill={vertexStyle.color}
        fillOpacity={vertexStyle.backgroundOpacity}
        stroke={strokeWidth > 0 ? vertexStyle.borderColor : "none"}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash(vertexStyle.borderStyle)}
      >
        {shapeEl}
      </g>
      {iconDataUrl ? (
        <image
          href={iconDataUrl}
          x={iconOffset}
          y={iconOffset}
          width={iconSize}
          height={iconSize}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
    </svg>
  );
}

export function VertexSymbolByType({
  vertexType,
  className,
}: {
  vertexType: VertexType;
  className?: string;
}) {
  const vertexStyle = useVertexStyle(vertexType);
  return <VertexSymbol vertexStyle={vertexStyle} className={className} />;
}

function strokeDash(style: string): string | undefined {
  if (style === "dashed") return "6 4";
  if (style === "dotted") return "2 3";
  return undefined;
}

function renderShape(
  geometry: ReturnType<typeof resolveShapeGeometry>,
  size: number,
  transform: string,
) {
  switch (geometry.type) {
    case "polygon":
      return <polygon points={geometry.points} transform={transform} />;
    case "round-polygon":
    case "round-rectangle":
    case "cut-rectangle":
    case "barrel":
      return <path d={geometry.path} transform={transform} />;
    case "ellipse":
      return (
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size / 2}
          ry={size / 2}
          transform={transform}
        />
      );
    default: {
      const _exhaustive: never = geometry;
      return _exhaustive;
    }
  }
}
