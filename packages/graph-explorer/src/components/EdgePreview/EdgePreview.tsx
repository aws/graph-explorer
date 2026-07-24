import type { ComponentPropsWithoutRef } from "react";

import type { EdgeStyle } from "@/core";

import { identityTransform, type TextTransformer } from "@/hooks";
import { cn } from "@/utils";

import { edgePreviewLabel } from "../previewLabels";
import { EdgeLinePreview } from "./EdgeLinePreview";

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
 * Full edge preview: two placeholder nodes connected by the styled edge with
 * the given label. The edge itself (line + arrow heads + label) is drawn by
 * {@link EdgeLinePreview}, ported verbatim from cytoscape so the preview
 * matches the canvas. Apply CSS `zoom` via className to scale.
 */
export function EdgePreview({
  edgeStyle,
  transform = identityTransform,
  className,
}: EdgePreviewProps) {
  const label = edgePreviewLabel(edgeStyle, transform);

  return (
    <div
      className={cn("flex w-full items-center", className)}
      role="img"
      aria-label={`${label} edge preview`}
    >
      <VertexPlaceholder />

      <div className="flex min-w-24 flex-1 items-center self-center">
        <EdgeLinePreview
          edgeStyle={edgeStyle}
          orientation="horizontal"
          label={label}
        />
      </div>

      <VertexPlaceholder />
    </div>
  );
}
