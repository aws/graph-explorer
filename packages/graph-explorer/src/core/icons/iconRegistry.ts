import DOMPurify from "dompurify";

import { logger } from "@/utils";
import { getLucideSvgString } from "@/utils/lucideIcons";

import { type IconSource, type IconSourceId, iconSourceId } from "./iconSource";

/** An icon resolved to a renderable form, with no color applied yet. */
export type ResolvedIcon =
  | { kind: "raster"; url: string }
  | { kind: "svg"; svg: string };

/**
 * Bounded so a permanently broken icon stops re-fetching, but not one-shot: a
 * single transient failure must not blank an icon for the life of the page.
 * Attempts run back to back with no backoff, so this is a cap on wasted work
 * rather than a recovery strategy for a flaky endpoint.
 */
const MAX_ATTEMPTS = 3;

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
  #failures = new Map<IconSourceId, number>();
  #listeners = new Set<() => void>();
  #epoch = 0;

  /** Stable reference until something resolves, as `useSyncExternalStore` requires. */
  getSnapshot = (): ReadonlyMap<IconSourceId, ResolvedIcon> => this.#resolved;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  /** Resolutions still running. Tests only. */
  get pendingCount(): number {
    return this.#inFlight.size;
  }

  /** Idempotent: starts only what is neither resolved, running, nor exhausted. */
  request(sources: Iterable<IconSource>): void {
    let next: Map<IconSourceId, ResolvedIcon> | undefined;

    for (const source of sources) {
      const id = iconSourceId(source);
      if (id === null || this.#resolved.has(id) || this.#inFlight.has(id)) {
        continue;
      }
      if (source.kind === "raster") {
        // A url needs no work, so resolve it now rather than a render later.
        next ??= new Map(this.#resolved);
        next.set(id, { kind: "raster", url: source.url });
        continue;
      }
      if ((this.#failures.get(id) ?? 0) >= MAX_ATTEMPTS) {
        continue;
      }
      this.#inFlight.add(id);
      void this.#resolve(id, source, this.#epoch);
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
    this.#failures.clear();
  }

  async #resolve(
    id: IconSourceId,
    source: IconSource,
    epoch: number,
  ): Promise<void> {
    try {
      const resolved = await resolveIconSource(source);
      if (epoch !== this.#epoch) {
        return;
      }
      if (resolved) {
        this.#resolved = new Map(this.#resolved).set(id, resolved);
        this.#failures.delete(id);
      } else {
        this.#countFailure(id);
      }
    } catch (e) {
      if (epoch !== this.#epoch) {
        return;
      }
      this.#countFailure(id);
      logger.error("Failed to resolve icon", e, id);
    } finally {
      if (epoch === this.#epoch) {
        this.#inFlight.delete(id);
        this.#notify();
      }
    }
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }

  /** A failure is never stored as a result, so the count is what bounds retries. */
  #countFailure(id: IconSourceId): void {
    this.#failures.set(id, (this.#failures.get(id) ?? 0) + 1);
  }
}

export const iconRegistry = new IconRegistry();

async function resolveIconSource(
  source: IconSource,
): Promise<ResolvedIcon | null> {
  switch (source.kind) {
    case "none":
      return null;
    case "raster":
      return { kind: "raster", url: source.url };
    case "lucide": {
      const svg = await getLucideSvgString(source.name);
      if (svg === null) {
        logger.warn("Unknown lucide icon", source.name);
        return null;
      }
      return { kind: "svg", svg };
    }
    case "svg": {
      // Untrusted: a user-supplied SVG, sanitized before it is used anywhere.
      const response = await fetch(source.url);
      const svg = DOMPurify.sanitize(await response.text(), {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
      // A 404 body sanitizes to something that is not SVG. Reject it here so
      // consumers can treat `ResolvedIcon` as renderable.
      return isParseableSvg(svg) ? { kind: "svg", svg } : null;
    }
  }
}

function isParseableSvg(svg: string): boolean {
  const doc = new DOMParser().parseFromString(svg, "application/xml");
  return (
    doc.querySelector("parsererror") === null &&
    doc.documentElement.localName === "svg"
  );
}
