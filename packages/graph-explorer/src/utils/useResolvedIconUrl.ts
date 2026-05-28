import { useQuery } from "@tanstack/react-query";

import { isLucideIconRef, resolveIconUrl } from "./lucideIconUrl";

/**
 * Resolves a stored `iconUrl` to a value suitable for `<img>` / `<SVG>` src.
 *
 * - `lucide:<name>` refs are resolved asynchronously to a base64 SVG data URI
 *   and cached per session via React Query (`staleTime: Infinity`).
 * - `data:` URIs and plain URLs pass through synchronously via `initialData`,
 *   so consumers can render them immediately on the first paint.
 * - Returns `undefined` while a lucide ref is loading on cold-cache.
 */
export function useResolvedIconUrl(iconUrl: string): string | undefined {
  const { data } = useQuery({
    queryKey: ["resolved-icon", iconUrl],
    queryFn: () => resolveIconUrl(iconUrl),
    staleTime: Infinity,
    initialData: iconUrl && !isLucideIconRef(iconUrl) ? iconUrl : undefined,
  });
  return data ?? undefined;
}
