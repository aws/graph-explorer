/**
 * Fails the docs build when an internal link no longer resolves.
 *
 * The resolution logic lives in linkCheck.ts and is unit tested. This wrapper
 * only reads the build output and reports.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

import { checkLinks } from "./linkCheck.ts";

const outputDir = "dist";

function main(): void {
  // Files only. A directory entry would let a link naming a directory with no
  // index.html resolve against it and pass.
  const filePaths = readdirSync(outputDir, {
    recursive: true,
    withFileTypes: true,
  })
    .filter(entry => entry.isFile())
    .map(entry =>
      join(entry.parentPath, entry.name).slice(outputDir.length + 1),
    )
    .map(path => path.split(sep).join("/"));

  const pages = new Map(
    filePaths
      .filter(path => path.endsWith(".html"))
      .map(path => [path, readFileSync(join(outputDir, path), "utf8")]),
  );

  if (pages.size === 0) {
    console.error(`check-links: no HTML in ${outputDir}. Run the build first.`);
    process.exit(1);
  }

  const { checked, pages: pageCount, broken } = checkLinks(pages, filePaths);
  console.log(`Checked ${checked} internal links across ${pageCount} pages.`);

  if (broken.length === 0) {
    console.log("All internal links resolve.");
    return;
  }
  for (const { source, href, reason } of broken) {
    console.error(`  ${source} -> ${href}  (${reason})`);
  }
  console.error(`check-links: ${broken.length} broken internal link(s).`);
  process.exit(1);
}

main();
