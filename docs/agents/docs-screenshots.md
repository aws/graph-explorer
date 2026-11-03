# Docs Screenshots

How to retake the three docs landing page screenshots so they match each other and the last set. Retake all three together after a UI change that shows in any of them.

| File | View |
| --- | --- |
| `graph-explorer.png` | Graph tab: Dallas, Seattle, and Vancouver with the six routes between them, Table View open, Search > Filter in the sidebar with Anchorage expanded |
| `schema-explorer.png` | Schema tab: `airport`, `country`, `continent`, and `version`, with `airport` selected and Selection Details open |
| `data-explorer.png` | Data Table tab on `airport`, rows 1 to 18, columns sized to their content |

They live in `packages/docs/public/images/` and keep these names, since `packages/docs/src/pages/index.astro` loads them by name. The README's `images/` folder holds an older framed set that this procedure doesn't produce.

## Setup

1. Start Gremlin Server with the air routes sample, published on loopback. Host port 18182 is the script's default:

   ```sh
   docker run -d --name gx-screens-gremlin --hostname database \
     -p 127.0.0.1:18182:8182 \
     -v "$PWD/samples/air_routes/sample:/opt/gremlin-server/sample:ro" \
     --entrypoint /opt/gremlin-server/bin/gremlin-server.sh \
     tinkerpop/gremlin-server:3.8 \
     /opt/gremlin-server/sample/conf/gremlin-server-air-routes.yaml
   ```

   `--hostname database` is required: the sample config binds to the host name `database`, and the server exits without it. Loading takes about 30 seconds. It is ready when `g.V().count()` returns 3749.

2. Start the app from the repo root: `PROXY_SERVER_PORT=9251 GRAPH_EXP_DEV_PORT=5188 vp run dev`. Any free ports work. Pass `--app http://localhost:<port>/` to the script when you change the dev port.

3. Run the capture from the repo root: `vpx packages/docs/screenshots/capture.ts`. It needs Google Chrome installed, and writes straight over the three files. Flags: `--app`, `--db` (default `http://127.0.0.1:18182`), `--out` (another folder, for a dry run), and `--only graph,schema,data`.

4. Stop what you started: `docker rm -f gx-screens-gremlin`, then the dev server.

Graph Explorer keeps its connections and styles in the browser profile, so the script starts from a fresh profile each run.

## What the script fixes

`packages/docs/screenshots/capture.ts` makes these choices. Change them there, not by hand.

- **Connection**: a proxied Gremlin connection named "Local Gremlin Server". Its name shows in the app header.
- **Styles**: `packages/docs/screenshots/styles.json`, loaded through Settings > Styles. Indigo control tower airports, red flag countries, green globe continents, gray package versions, and navy 1px edges whose label background matches the canvas, so labels show no box.
- **Viewport**: 1440×870 CSS px at device scale factor 2, light color scheme, so each file is 2880×1740.
- **Theme**: light only. The app has no dark theme yet.
- **Node placement**: both views run a random force layout, so the script moves each node through the Cytoscape instance to a fixed fraction of the canvas and zooms so a node is a fixed fraction of the canvas width (`graphPlacement`, `schemaPlacement`).
- **Column widths**: the data table's columns default to equal widths that wrap `desc`. The script drags each resize handle to `columnWidths`.
- **Compression**: each capture is recompressed losslessly with sharp.

When a UI change breaks a step, update the script's selector or step and keep the views above. When the change adds or moves part of a view (a new sidebar tab, a taller header), keep the same data and placements and say so in the PR.

## Framing

The files are bare viewport captures: no browser chrome, shadow, rounded corners, or backdrop. `packages/docs/src/components/ScreenshotCarousel.astro` frames them in CSS: a 1px inset outline, a two-layer soft shadow, and a 0.75rem radius. Leave framing in the CSS so it can follow the theme.

## Check

1. Open each file and compare it with the version on `main`: same three airports, same placements, same columns, edges at 1px.
2. Run `vp run docs:build`, then view the landing page carousel in both site themes and at 375px.
