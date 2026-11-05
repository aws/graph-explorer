/**
 * Captures the docs landing page screenshots from a running Graph Explorer and
 * a Gremlin Server loaded with the air routes sample. See
 * `docs/agents/docs-screenshots.md` for the setup.
 *
 * vpx packages/docs/screenshots/capture.ts [--app <url>] [--db <url>] [--out <dir>] [--only graph,schema,data]
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Page } from "playwright-core";
import sharp from "sharp";

const here = import.meta.dirname;
const { values: args } = parseArgs({
  options: {
    app: { type: "string", default: "http://localhost:5188/" },
    db: { type: "string", default: "http://127.0.0.1:18182" },
    out: { type: "string", default: path.join(here, "../public/images") },
    only: { type: "string", default: "graph,schema,data" },
  },
});

const shots = new Set(args.only.split(","));
const stylesFile = path.join(here, "styles.json");

/** Canvas position (0 to 1 of the canvas width and height) for each node id. */
type Placement = Record<string, [number, number]>;

/** The parts of a Cytoscape core this script calls. */
type CytoscapeCore = {
  width(): number;
  height(): number;
  zoom(level?: number): number;
  nodes(): { 0: { renderedWidth(): number } };
  getElementById(id: string): {
    renderedPosition(position?: { x: number; y: number }): {
      x: number;
      y: number;
    };
  };
};

const graphPlacement: Placement = {
  "(num)48": [0.549, 0.2],
  "(num)8": [0.354, 0.7],
  "(num)22": [0.624, 0.8],
};

const schemaPlacement: Placement = {
  airport: [0.646, 0.256],
  country: [0.226, 0.415],
  continent: [0.479, 0.84],
  version: [0.774, 0.609],
};

/** Data table column widths in CSS px, left to right. */
const columnWidths = [96, 142, 66, 76, 363, 66, 66, 87, 100, 82, 80, 80, 119];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 870 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const page = await context.newPage();

try {
  await connect(page);
  await loadStyles(page);
  if (shots.has("graph")) await captureGraph(page);
  if (shots.has("schema")) await captureSchema(page);
  if (shots.has("data")) await captureData(page);
} finally {
  await browser.close();
}

async function connect(page: Page) {
  await page.goto(`${args.app}#/connections`);
  await page.getByRole("button", { name: "Add New Connection" }).last().click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Name" })
    .fill("Local Gremlin Server");
  await dialog.getByRole("textbox", { name: "Database URL" }).fill(args.db);
  await dialog.getByRole("button", { name: "Add Connection" }).click();
  await page.getByText("Last Synchronization").waitFor();
  await page.getByText("airport").first().waitFor();
}

async function loadStyles(page: Page) {
  await page.goto(`${args.app}#/settings/styles`);
  await page.locator("input[type=file]").setInputFiles(stylesFile);
  await page.getByRole("button", { name: /^Load \d+ selected$/ }).click();
  await page.waitForTimeout(500);
}

async function captureGraph(page: Page) {
  await page.goto(`${args.app}#/graph-explorer`);
  await page.getByRole("tab", { name: "Query", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Query" })
    .fill(
      "g.V(8,48,22).union(identity(), outE('route').where(inV().hasId(within(8,22,48))))",
    );
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Add All" }).click();
  await page.waitForTimeout(1500);

  await page.getByRole("tab", { name: "Filter", exact: true }).click();
  await pickOption(page, "Node Label", "airport");
  await pickOption(page, "Property", "code");
  await page.waitForTimeout(1500);
  await page.getByText("Anchorage Ted Stevens").first().click();
  await page.waitForTimeout(6000);

  await placeNodes(page, graphPlacement, 0.052);
  await save(page, "graph-explorer.png");
}

async function captureSchema(page: Page) {
  await page.goto(`${args.app}#/schema-explorer`);
  await page.waitForTimeout(4000);
  const airport = await placeNodes(page, schemaPlacement, 0.084);
  await page.mouse.click(airport.x, airport.y);
  await page.getByText("Total Count").waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  await save(page, "schema-explorer.png");
}

async function captureData(page: Page) {
  await page.goto(`${args.app}#/data-explorer/airport`);
  await page.getByRole("cell", { name: "Atlanta", exact: true }).waitFor();
  const headers = page.locator("thead tr").first().locator("th");
  for (const [index, width] of columnWidths.entries()) {
    const box = await headers.nth(index).boundingBox();
    if (!box) throw new Error(`Column ${index} is not visible`);
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width - 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + width - 2, y, { steps: 8 });
    await page.mouse.up();
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await save(page, "data-explorer.png");
}

/** Saves a viewport capture, recompressed losslessly to keep the site small. */
async function save(page: Page, fileName: string) {
  const png = await page.screenshot();
  await sharp(png)
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(args.out, fileName));
}

async function pickOption(page: Page, label: string, option: string) {
  const combobox = page.getByRole("combobox", { name: label });
  await combobox.click();
  await combobox.fill(option);
  await page.getByRole("option", { name: option, exact: true }).first().click();
}

/**
 * Sizes the first node to `nodeSize` of the canvas width, moves each node to
 * its placement, and returns the page position of the first placed node.
 */
async function placeNodes(page: Page, placement: Placement, nodeSize: number) {
  const first = await page.evaluate(
    ([placement, nodeSize]) => {
      const host = [...document.querySelectorAll("div")].find(
        div => "_cyreg" in div,
      );
      if (!host) throw new Error("No Cytoscape instance on the page");
      // Graph Explorer keeps no handle on its Cytoscape core, so read the
      // one Cytoscape stores on its container element.
      const cy = (host as unknown as { _cyreg: { cy: CytoscapeCore } })._cyreg
        .cy;
      const width = cy.width();
      const height = cy.height();
      cy.zoom((cy.zoom() * nodeSize * width) / cy.nodes()[0].renderedWidth());
      for (const [id, [x, y]] of Object.entries(placement)) {
        cy.getElementById(id).renderedPosition({ x: x * width, y: y * height });
      }
      const [firstId] = Object.keys(placement);
      const rendered = cy.getElementById(firstId).renderedPosition();
      const origin = host.getBoundingClientRect();
      return { x: origin.x + rendered.x, y: origin.y + rendered.y };
    },
    [placement, nodeSize] as const,
  );
  await page.waitForTimeout(500);
  return first;
}
