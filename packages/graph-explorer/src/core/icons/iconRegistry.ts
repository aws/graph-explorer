import logger from "@/utils/logger";
import { getLucideSvgString } from "@/utils/lucideIcons";

import { type IconSource, type IconSourceId, iconSourceId } from "./iconSource";
import { sanitizeSvg } from "./svgMarkup";

/** An icon resolved to a renderable form, with no color applied yet. */
export type ResolvedIcon =
  | { kind: "raster"; url: string }
  | { kind: "svg"; svg: string };

/**
 * Identity-keyed store of resolved icons, shared by every surface that draws a
 * vertex icon.
 *
 * Deliberately not TanStack Query: its per-hook subscription model scales with
 * vertex types and locked up the schema view at 10k.
 * See docs/adr/20260813-icon-registry-not-react-query.md.
 */
class IconRegistry {
  #resolved: ReadonlyMap<IconSourceId, ResolvedIcon> = new Map();
  #inFlight = new Set<IconSourceId>();
  /** Every icon value is a lucide name or a data url, so a failure is final. */
  #unresolvable = new Set<IconSourceId>();
  #listeners = new Set<() => void>();
  #epoch = 0;

  /** Stable reference until something resolves, as `useSyncExternalStore` requires. */
  getSnapshot = (): ReadonlyMap<IconSourceId, ResolvedIcon> => this.#resolved;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  /** Lucide resolutions still running. Tests only. */
  get pendingCount(): number {
    return this.#inFlight.size;
  }

  /**
   * Idempotent: starts only what is neither resolved, running, nor known to
   * fail. Everything but a lucide icon resolves before this returns, so the
   * consumer does not wait a render for markup it already has.
   */
  request(sources: Iterable<IconSource>): void {
    let next: Map<IconSourceId, ResolvedIcon> | undefined;

    for (const source of sources) {
      const id = iconSourceId(source);
      if (
        id === null ||
        this.#resolved.has(id) ||
        this.#inFlight.has(id) ||
        this.#unresolvable.has(id)
      ) {
        continue;
      }
      if (source.kind === "lucide") {
        this.#inFlight.add(id);
        void this.#resolveLucide(id, source.name, this.#epoch);
        continue;
      }
      const resolved = resolveDataSource(source);
      if (resolved === null) {
        this.#unresolvable.add(id);
        continue;
      }
      next ??= new Map(this.#resolved);
      next.set(id, resolved);
    }

    if (next) {
      this.#resolved = next;
      this.#notify();
    }
  }

  /**
   * Drops all state. Tests only.
   *
   * Bumps the epoch so a resolution still in flight cannot repopulate the
   * registry after the reset. Listeners are left alone: they belong to
   * `useSyncExternalStore`, and dropping them would silently and permanently
   * unsubscribe a mounted component.
   */
  reset(): void {
    this.#epoch++;
    this.#resolved = new Map();
    this.#inFlight.clear();
    this.#unresolvable.clear();
  }

  async #resolveLucide(
    id: IconSourceId,
    name: string,
    epoch: number,
  ): Promise<void> {
    const svg = await getLucideSvgString(name);
    if (epoch !== this.#epoch) {
      return;
    }
    this.#inFlight.delete(id);
    if (svg === null) {
      logger.warn("Unknown lucide icon", name);
      this.#unresolvable.add(id);
      return;
    }
    // Lucide markup always carries a viewBox.
    this.#resolved = new Map(this.#resolved).set(id, { kind: "svg", svg });
    this.#notify();
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}

export const iconRegistry = new IconRegistry();

function resolveDataSource(
  source: Exclude<IconSource, { kind: "lucide" }>,
): ResolvedIcon | null {
  switch (source.kind) {
    case "none":
      return null;
    case "raster":
      return { kind: "raster", url: source.url };
    case "svg": {
      // Untrusted: a user-supplied SVG, sanitized before it is used anywhere.
      const markup = decodeBase64DataUrl(source.url);
      const svg = markup === null ? null : sanitizeSvg(markup);
      if (svg === null) {
        logger.warn("Unusable svg icon");
        return null;
      }
      return { kind: "svg", svg };
    }
  }
}

const BASE64_MARKER = ";base64,";

/**
 * The UTF-8 text of a base64 `data:` url, or `null` when it does not decode.
 * The icon allowlist checks only the prefix, so the payload is unvalidated.
 */
function decodeBase64DataUrl(url: string): string | null {
  const markerAt = url.indexOf(BASE64_MARKER);
  if (!url.startsWith("data:") || markerAt === -1) {
    return null;
  }
  let binary: string;
  try {
    binary = atob(url.slice(markerAt + BASE64_MARKER.length));
  } catch {
    return null;
  }
  return new TextDecoder().decode(
    Uint8Array.from(binary, char => char.charCodeAt(0)),
  );
}
