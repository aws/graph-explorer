import type { ReactNode } from "react";

import { ArrowDownIcon, ArrowRightIcon } from "lucide-react";

/**
 * The before→after scaffold for node cards: the two previews and the arrow sit
 * on the top row of a three-column grid; the before/after labels float on the
 * row beneath, each aligned under its own preview so the arrow column stays
 * empty.
 *
 * ```
 * | before  |  →  | after   |
 * | BEFORE  |     | AFTER   |
 * ```
 */
export function BeforeAfterPreview({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: ReactNode;
  after: ReactNode;
  beforeLabel: ReactNode;
  afterLabel: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-(--card-spacing)">
      <BeforeLabel>{beforeLabel}</BeforeLabel>
      <span />
      <AfterLabel>{afterLabel}</AfterLabel>
      <div className="opacity-60">{before}</div>
      <ArrowRightIcon className="text-primary-foreground/50 size-4 shrink-0" />
      <div>{after}</div>
    </div>
  );
}

/**
 * The before→after scaffold for edge cards: the previews stack vertically with
 * each label above its preview and a down-arrow between them. Edge previews are
 * wide, so stacking keeps the card the same width as a node card.
 *
 * ```
 * BEFORE
 * before
 *   ↓
 * AFTER
 * after
 * ```
 */
export function VerticalBeforeAfterPreview({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: ReactNode;
  after: ReactNode;
  beforeLabel: ReactNode;
  afterLabel: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-(--card-spacing)">
      <BeforeLabel>{beforeLabel}</BeforeLabel>
      <div className="w-full opacity-60">{before}</div>
      <ArrowDownIcon className="text-primary-foreground/50 size-4 shrink-0" />
      <AfterLabel>{afterLabel}</AfterLabel>
      <div className="w-full">{after}</div>
    </div>
  );
}

/** Tags the left preview cell as the style in effect before loading. */
export function BeforeLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-primary-foreground/50 text-xs font-semibold tracking-wide uppercase">
      {children}
    </span>
  );
}

/** Tags the right preview cell as the incoming style, accent-colored. */
export function AfterLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-primary-foreground text-xs font-semibold tracking-wide uppercase">
      {children}
    </span>
  );
}
