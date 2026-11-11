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
