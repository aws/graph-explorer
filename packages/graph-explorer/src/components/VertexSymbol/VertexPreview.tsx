import { appDefaultNodeLabelStyle, type VertexStyle } from "@/core";
import { cn } from "@/utils";

import { LabelPreview } from "../LabelPreview";
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
    <div className={cn("w-full min-w-0", className)}>
      {/* min-w-0 lets the column shrink so a long label truncates instead of overflowing */}
      <div className="flex min-w-0 flex-col items-center">
        <VertexSymbol vertexStyle={vertexStyle} className="size-[96px]" />
        <LabelPreview
          labelStyle={appDefaultNodeLabelStyle}
          scale={LABEL_SCALE}
          className="-mt-3"
        >
          {label}
        </LabelPreview>
      </div>
    </div>
  );
}
