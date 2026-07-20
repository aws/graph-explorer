import type { VertexStyle } from "@/core";

import { cn } from "@/utils";

import { defaultNodeLabelStyle, LabelPreview } from "../LabelPreview";
import { VertexSymbol } from "./VertexSymbol";

/**
 * The internal rendering size of the node in pixels. The VertexSymbol SVG has
 * a viewBox of 96×96, so we render at that native size for maximum fidelity.
 * The label scale maps cytoscape's 24 model-unit node to this render size.
 */
const RENDER_PX = 96;
const LABEL_SCALE = RENDER_PX / 24;

interface VertexPreviewProps {
  vertexStyle: VertexStyle;
  label: string;
  className?: string;
}

/**
 * A vertex shape preview with a label badge beneath it, matching the canvas
 * appearance. Rendered at a fixed internal size (96px) and CSS-scaled to the
 * desired display size — node and label zoom as a single unit.
 */
export function VertexPreview({
  vertexStyle,
  label,
  className,
}: VertexPreviewProps) {
  return (
    <div className={cn("shrink-0", className)}>
      <div className="flex origin-top-left flex-col items-center">
        <VertexSymbol vertexStyle={vertexStyle} className="size-[96px]" />
        <LabelPreview
          labelStyle={defaultNodeLabelStyle}
          scale={LABEL_SCALE}
          className="-mt-3"
        >
          {label}
        </LabelPreview>
      </div>
    </div>
  );
}
