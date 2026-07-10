import { useVertexStyle, type VertexStyle, type VertexType } from "@/core";
import { cn } from "@/utils";

import { resolveShapeGeometry } from "./nodeShapes";
import { useIconDataUrl } from "./useIconDataUrl";

const VIEWBOX = 96;
const ICON_RATIO = 0.6;

interface Props {
  vertexStyle: VertexStyle;
  className?: string;
}

export function VertexSymbol({ vertexStyle, className }: Props) {
  const iconDataUrl = useIconDataUrl(vertexStyle);
  const strokeWidth = vertexStyle.borderWidth;
  const insetSize = VIEWBOX - strokeWidth * 2;
  const geometry = resolveShapeGeometry(vertexStyle.shape, insetSize);
  const clipId = `vs-clip-${vertexStyle.type}`;

  const iconSize = VIEWBOX * ICON_RATIO;
  const iconOffset = (VIEWBOX - iconSize) / 2;

  const shapeEl = renderShape(geometry, insetSize);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={cn("size-9 shrink-0", className)}
      role="img"
      aria-label={`${vertexStyle.displayLabel ?? vertexStyle.type} symbol`}
    >
      <defs>
        <clipPath id={clipId}>
          <g transform={`translate(${strokeWidth} ${strokeWidth})`}>
            {shapeEl}
          </g>
        </clipPath>
      </defs>
      <g
        transform={`translate(${strokeWidth} ${strokeWidth})`}
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
) {
  switch (geometry.type) {
    case "polygon":
      return <polygon points={geometry.points} />;
    case "round-polygon":
    case "round-rectangle":
    case "cut-rectangle":
    case "barrel":
      return <path d={geometry.path} />;
    case "ellipse":
      return (
        <ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} />
      );
  }
}
