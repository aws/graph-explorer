import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { describe, expect, test } from "vite-plus/test";

async function buildUtilities(candidates: string[]): Promise<string> {
  const css = await readFile(new URL("./index.css", import.meta.url), "utf8");
  const compiler = await compile(css, {
    base: fileURLToPath(new URL(".", import.meta.url)),
    async loadStylesheet(id, base) {
      if (id === "tailwindcss") {
        const path = createRequire(import.meta.url).resolve(
          "tailwindcss/index.css",
        );
        return { path, base, content: await readFile(path, "utf8") };
      }
      // tw-animate-css defines no variants, so the test leaves it out.
      return { path: id, base, content: "" };
    },
  });
  return compiler.build(candidates);
}

describe("index.css custom variants", () => {
  test.each([
    ["data-checked:bg-primary", '[data-state="checked"]'],
    ["data-unchecked:bg-input-border", '[data-state="unchecked"]'],
    ["has-data-checked:border-primary", ':has([data-state="checked"])'],
    ["group-data-checked:flex", ':where(.group)[data-state="checked"] *'],
  ])("%s matches Radix's data-state", async (candidate, expected) => {
    expect(await buildUtilities([candidate])).toContain(expected);
  });
});

function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `no rule for ${selector}`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("\n  }\n", start));
}

function selectorFor(candidate: string): string {
  return `.${candidate.replace(/[^\w-]/g, "\\$&")}`;
}

describe("index.css focus-ring utility", () => {
  test("draws a 3px pale primary ring with no offset and a solid 1px primary edge", async () => {
    const rule = ruleFor(
      await buildUtilities(["focus-visible:focus-ring"]),
      ".focus-visible\\:focus-ring:focus-visible",
    );

    expect(rule).toContain("calc(3px + var(--tw-ring-offset-width))");
    expect(rule).toContain("var(--color-primary) 50%");
    expect(rule).not.toContain("--tw-ring-offset-width:");
    expect(rule).toContain("outline-style: solid");
    expect(rule).toContain("outline-width: 1px");
    expect(rule).toContain("outline-offset: calc(1px * -1)");
    expect(rule).toContain("outline-color: var(--color-primary)");
  });

  test("turns the ring and edge danger on an invalid control, after the primary colors", async () => {
    const rule = ruleFor(
      await buildUtilities(["focus-visible:focus-ring"]),
      ".focus-visible\\:focus-ring:focus-visible",
    );
    const invalid = rule.slice(rule.indexOf('&[aria-invalid="true"] {'));

    expect(invalid).toContain("var(--color-danger) 50%");
    expect(invalid).toContain("outline-color: var(--color-danger)");
    expect(rule.indexOf('&[aria-invalid="true"]')).toBeGreaterThan(
      rule.indexOf("outline-color: var(--color-primary)"),
    );
  });

  test.each([
    ["has-[:focus-visible]:focus-ring", ":has(:is(:focus-visible))"],
    ["focus-within:focus-ring", ":focus-within"],
  ])("applies through the %s variant", async (candidate, expected) => {
    expect(await buildUtilities([candidate])).toContain(expected);
  });

  const groupFocus = "has-[[data-slot=input-group-control]:focus-visible]";
  const groupInvalidFocus =
    "has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]";

  test.each([
    ["focus-visible:focus-ring", "focus-visible:ring-0"],
    ["focus-visible:focus-ring", "focus-visible:outline-none"],
    [`${groupFocus}:focus-ring`, `${groupInvalidFocus}:ring-danger/50`],
    [`${groupFocus}:focus-ring`, `${groupInvalidFocus}:outline-danger`],
    ["focus-visible:focus-ring", "focus-visible:outline-background"],
    [
      "focus-visible:focus-ring",
      "data-checked:focus-visible:outline-background",
    ],
    [
      "focus-visible:focus-ring",
      "data-[state=active]:focus-visible:outline-background",
    ],
    [
      "focus-visible:focus-ring",
      "data-[state=indeterminate]:focus-visible:outline-background",
    ],
  ])("lets %s be overridden by %s", async (ring, override) => {
    const css = await buildUtilities([ring, override]);

    expect(css.indexOf(selectorFor(ring))).toBeGreaterThan(-1);
    expect(css.indexOf(selectorFor(ring))).toBeLessThan(
      css.indexOf(selectorFor(override)),
    );
  });
});
