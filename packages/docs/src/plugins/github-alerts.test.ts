import { markdownToHtml, mdxToJs } from "satteri";
import { describe, expect, test } from "vite-plus/test";

import { githubAlerts } from "./github-alerts";

function render(source: string) {
  return markdownToHtml(source, { mdastPlugins: [githubAlerts()] }).html;
}

describe("githubAlerts", () => {
  test.each([
    ["NOTE", "note", "Note"],
    ["TIP", "tip", "Tip"],
    ["IMPORTANT", "important", "Important"],
    ["WARNING", "warning", "Warning"],
    ["CAUTION", "caution", "Caution"],
  ])("renders [!%s] as a %s alert", (marker, type, title) => {
    const html = render(`> [!${marker}]\n> Body text.`);

    expect(html).toContain(
      `<div class="markdown-alert markdown-alert-${type}">`,
    );
    expect(html).toMatch(
      new RegExp(
        `<p class="markdown-alert-title"><svg[^>]*>.*</svg>${title}</p>`,
      ),
    );
    expect(html).toContain("<p>Body text.</p>");
    expect(html).not.toContain("<blockquote>");
    expect(html).not.toContain(`[!${marker}]`);
  });

  test("accepts a lowercase marker", () => {
    expect(render("> [!note]\n> Body.")).toContain("markdown-alert-note");
  });

  test("keeps every block after the marker", () => {
    const html = render(
      "> [!WARNING]\n> First.\n>\n> - one\n> - two\n>\n> ```\n> code\n> ```",
    );

    expect(html).toContain("<p>First.</p>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("code");
  });

  test("keeps inline markup in the first paragraph", () => {
    expect(
      render("> [!TIP]\n> Use `vp` and [the docs](https://example.com)."),
    ).toMatch(
      /<p>Use <code>vp<\/code> and <a href="https:\/\/example.com">the docs<\/a>.<\/p>/,
    );
  });

  test("leaves a plain blockquote alone", () => {
    expect(render("> Just a quote.")).toBe(
      "<blockquote>\n<p>Just a quote.</p>\n</blockquote>\n",
    );
  });

  test("leaves an unknown marker alone", () => {
    expect(render("> [!DANGER]\n> Body.")).toContain("<blockquote>");
  });

  test("leaves a marker that isn't on its own line alone", () => {
    expect(render("> [!NOTE] inline text")).toContain("<blockquote>");
  });

  test("accepts a blank line between the marker and the body", () => {
    const html = render("> [!NOTE]\n>\n> Body.");

    expect(html).toContain("markdown-alert-note");
    expect(html).toContain("<p>Body.</p>");
  });

  test("converts an alert in a list item", () => {
    expect(render("1. Step.\n\n   > [!NOTE]\n   > Body.")).toContain(
      "markdown-alert-note",
    );
  });

  test("leaves an alert inside a blockquote alone", () => {
    expect(render("> > [!NOTE]\n> > Body.")).not.toContain("markdown-alert");
  });

  test("converts alerts in MDX", () => {
    const { code } = mdxToJs("> [!CAUTION]\n> Body.", {
      mdastPlugins: [githubAlerts()],
    });

    expect(code).toContain("markdown-alert markdown-alert-caution");
  });
});
