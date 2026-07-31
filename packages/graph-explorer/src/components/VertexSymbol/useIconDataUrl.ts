import { useQuery } from "@tanstack/react-query";

import type { VertexStyle } from "@/core";

import { renderNode } from "@/modules/GraphViewer/renderNode";

/**
 * Runs the production icon pipeline (fetch → sanitize → recolor → data URL)
 * via the same TanStack Query cache the canvas uses, so icons are deduped and
 * load instantly after the first fetch.
 */
export function useIconDataUrl(style: VertexStyle): string | null {
  const { type, iconUrl, iconImageType, color } = style;
  const { data } = useQuery({
    queryKey: ["vertex-symbol-icon", type, iconUrl, iconImageType, color],
    queryFn: ({ client }) =>
      renderNode(client, { type, iconUrl, iconImageType, color }),
    staleTime: Infinity,
    enabled: !!iconUrl,
  });
  return data ?? null;
}
