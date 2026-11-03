import type { AstroIntegration } from "astro";

import { isSatteriProcessor } from "@astrojs/markdown-satteri";
import { type Custom, defineMdastPlugin, type MdastNode } from "satteri";

type Blockquote = Extract<MdastNode, { type: "blockquote" }>;
type BlockContent = Blockquote["children"][number];

type IconNode = readonly (readonly [string, Record<string, string>])[];

/** Lucide icons, copied from `@lucide/astro` since its exports are Astro components. */
const alertTypes = {
  note: {
    title: "Note",
    icon: [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 16v-4" }],
      ["path", { d: "M12 8h.01" }],
    ],
  },
  tip: {
    title: "Tip",
    icon: [
      [
        "path",
        {
          d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
        },
      ],
      ["path", { d: "M9 18h6" }],
      ["path", { d: "M10 22h4" }],
    ],
  },
  important: {
    title: "Important",
    icon: [
      [
        "path",
        {
          d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
        },
      ],
      ["path", { d: "M12 15h.01" }],
      ["path", { d: "M12 7v4" }],
    ],
  },
  warning: {
    title: "Warning",
    icon: [
      [
        "path",
        {
          d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
        },
      ],
      ["path", { d: "M12 9v4" }],
      ["path", { d: "M12 17h.01" }],
    ],
  },
  caution: {
    title: "Caution",
    icon: [
      ["path", { d: "M12 16h.01" }],
      ["path", { d: "M12 8v4" }],
      [
        "path",
        {
          d: "M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z",
        },
      ],
    ],
  },
} as const satisfies Record<string, { title: string; icon: IconNode }>;

type AlertType = keyof typeof alertTypes;

const markerPattern =
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/i;

function element(
  hName: string,
  hProperties: Record<string, unknown>,
  children: Custom["children"] = [],
): Custom {
  return { type: "githubAlertElement", data: { hName, hProperties }, children };
}

function alertTitle(type: AlertType): Custom {
  const { title, icon } = alertTypes[type];
  const svg = element(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ariaHidden: "true",
    },
    icon.map(([tag, attributes]) => element(tag, attributes)),
  );
  return element("p", { className: ["markdown-alert-title"] }, [
    svg,
    { type: "text", value: title },
  ]);
}

/** Splits a GitHub alert marker off the start of a blockquote, or returns undefined when there is none. */
function parseAlert(
  blockquote: Readonly<Blockquote>,
): { type: AlertType; body: BlockContent[] } | undefined {
  const [first, ...rest] = blockquote.children;
  if (first?.type !== "paragraph") return undefined;
  const [lead, ...inline] = first.children;
  if (lead?.type !== "text") return undefined;
  const match = markerPattern.exec(lead.value);
  if (!match) return undefined;

  const remainder = lead.value.slice(match[0].length);
  const paragraphChildren = remainder
    ? [{ ...lead, value: remainder }, ...inline]
    : inline;
  const body: BlockContent[] =
    paragraphChildren.length > 0
      ? [{ ...first, children: paragraphChildren }, ...rest]
      : rest;
  return { type: match[1].toLowerCase() as AlertType, body };
}

/** Renders GitHub's `> [!NOTE]` alert syntax as GitHub's `markdown-alert` markup. */
export function githubAlerts() {
  return defineMdastPlugin({
    name: "github-alerts",
    blockquote(node, ctx) {
      // GitHub also skips alerts in list items, but docs steps need them there.
      if (ctx.parent(node).type === "blockquote") return;
      const alert = parseAlert(node);
      if (!alert) return;
      ctx.replaceNode(node, {
        type: "githubAlert",
        data: {
          hName: "div",
          hProperties: {
            className: ["markdown-alert", `markdown-alert-${alert.type}`],
          },
        },
        children: [alertTitle(alert.type), ...alert.body],
      });
    },
  });
}

/** Registers {@link githubAlerts} ahead of Starlight's own Markdown plugins. */
export function githubAlertsIntegration(): AstroIntegration {
  return {
    name: "github-alerts",
    hooks: {
      "astro:config:setup": ({ config }) => {
        const { processor } = config.markdown;
        if (!isSatteriProcessor(processor)) {
          throw new Error(
            `github-alerts needs the Sätteri Markdown processor, not "${processor.name}".`,
          );
        }
        processor.options.mdastPlugins.unshift(githubAlerts());
      },
    },
  };
}
