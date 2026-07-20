import { appDefaultNodeLabelStyle, type VertexStyle } from "@/core";
import { cn } from "@/utils";

import { LabelPreview } from "../LabelPreview";
import { MODEL_TO_VIEWBOX_SCALE, VertexSymbol } from "./VertexSymbol";

interface VertexPreviewProps {
  vertexStyle: VertexStyle;
  label: string;
  className?: string;
}

/**
 * A vertex shape preview with a label badge beneath it, matching the canvas
 * appearance. The label uses the same model→viewBox scale the symbol renders
 * at, so node and label stay proportional as the caller CSS-zooms the preview.
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
          scale={MODEL_TO_VIEWBOX_SCALE}
          className="-mt-3"
        >
          {label}
        </LabelPreview>
      </div>
    </div>
  );
}
