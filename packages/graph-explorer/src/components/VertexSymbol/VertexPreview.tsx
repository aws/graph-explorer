import { appDefaultNodeLabelStyle, type VertexStyle } from "@/core";
import { identityTransform, type TextTransformer } from "@/hooks";
import { cn } from "@/utils";

import { LabelPreview } from "../LabelPreview";
import { vertexPreviewLabel } from "../previewLabels";
import { PREVIEW_SCALE, VertexSymbol } from "./VertexSymbol";

interface VertexPreviewProps {
  vertexStyle: VertexStyle;
  /**
   * Transform applied to type/attribute names in the label — pass the
   * connection's `useTextTransform()` to match the canvas (e.g. SPARQL prefix
   * folding). Defaults to identity so a preview of a style from another source
   * (an import file) is not reinterpreted through the active connection.
   */
  transform?: TextTransformer;
  className?: string;
}

/**
 * A vertex shape preview with a two-line label badge beneath it, matching the
 * canvas node badge: a bold type line above the display-name line. Both derive
 * from the resolved style, and the badge uses the same model→viewBox scale the
 * symbol renders at, so node and label stay proportional as the caller
 * CSS-zooms the preview.
 */
export function VertexPreview({
  vertexStyle,
  transform = identityTransform,
  className,
}: VertexPreviewProps) {
  const { type, name } = vertexPreviewLabel(vertexStyle, transform);

  return (
    <div className={cn("w-full min-w-0", className)}>
      {/* min-w-0 lets the column shrink so a long label truncates instead of overflowing */}
      <div className="flex min-w-0 flex-col items-center">
        <VertexSymbol vertexStyle={vertexStyle} className="size-[96px]" />
        <LabelPreview
          labelStyle={appDefaultNodeLabelStyle}
          scale={PREVIEW_SCALE}
          className="-mt-3 flex flex-col"
        >
          <span className="truncate text-[0.7em] font-bold">{type}</span>
          <span className="truncate">{name}</span>
        </LabelPreview>
      </div>
    </div>
  );
}
