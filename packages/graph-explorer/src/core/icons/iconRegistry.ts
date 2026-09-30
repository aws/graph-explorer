import logger from "@/utils/logger";
import { getLucideSvgString } from "@/utils/lucideIcons";

import { type IconSource, type IconSourceId, iconSourceId } from "./iconSource";
import { ensureSvgViewBox, sanitizeSvg } from "./svgViewBox";

/**
 * An icon resolved to a renderable form, with no color applied yet. A raster
 * url is always a `data:` url.
 */
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
      if (source.kind === "raster" && source.url.startsWith("data:")) {
        // Already inline, so resolve it now rather than a render later.
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
    case "raster": {
      const url = await fetchRasterAsDataUrl(source.url);
      return url === null ? null : { kind: "raster", url };
    }
    case "lucide": {
      const raw = await getLucideSvgString(source.name);
      if (raw === null) {
        logger.warn("Unknown lucide icon", source.name);
        return null;
      }
      return { kind: "svg", svg: ensureSvgViewBox(raw) };
    }
    case "svg": {
      // Untrusted: a user-supplied SVG, sanitized before it is used anywhere.
      const response = await fetch(source.url);
      const svg = sanitizeSvg(await response.text());
      // A 404 body sanitizes to something that is not SVG. Reject it here so
      // consumers can treat `ResolvedIcon` as renderable. Checked after
      // `sanitizeSvg`, not between sanitizing and synthesizing a viewBox:
      // `ensureSvgViewBox` no-ops on non-svg content, so the check gives the
      // same answer either way, and this way there is one call, not two.
      if (!isParseableSvg(svg)) {
        return null;
      }
      return { kind: "svg", svg };
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

const IMAGE_MIME_TYPE = /^image\/[a-z0-9.+-]+$/i;

/**
 * Inlines a remote raster, because the canvas nests icons inside a `data:`
 * svg, whose image sandbox fetches nothing external. `null` unless the
 * response is an image.
 */
async function fetchRasterAsDataUrl(url: string): Promise<string | null> {
  const response = await fetch(url);
  const mimeType = response.headers.get("content-type")?.split(";")[0].trim();
  if (!response.ok || !mimeType || !IMAGE_MIME_TYPE.test(mimeType)) {
    return null;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return `data:${mimeType};base64,${toBase64(bytes)}`;
}

/** Chunked, since spreading a whole image into one call overflows the stack. */
function toBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
