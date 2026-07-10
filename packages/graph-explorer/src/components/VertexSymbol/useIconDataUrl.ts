import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { VertexStyle } from "@/core";

import { renderNode } from "@/modules/GraphViewer/renderNode";

/**
 * Runs the production icon pipeline (fetch → sanitize → recolor → data URL)
 * via the same TanStack Query cache the canvas uses, so icons are deduped and
 * load instantly after the first fetch.
 */
export function useIconDataUrl(style: VertexStyle): string | null {
  const client = useQueryClient();
  const { type, iconUrl, iconImageType, color } = style;
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- client is a stable ref from useQueryClient
  const { data } = useQuery({
    queryKey: ["vertex-symbol-icon", type, iconUrl, iconImageType, color],
    queryFn: () => renderNode(client, { type, iconUrl, iconImageType, color }),
    staleTime: Infinity,
  });
  return data ?? null;
}
