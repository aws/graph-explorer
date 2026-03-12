# Default Styling Configuration

Graph Explorer supports an optional `defaultStyling.json` file that provides
default vertex and edge styling for all users. This is useful for:

- Non-persistent browser environments (e.g., AWS WorkSpaces Web) where IndexedDB
  is cleared between sessions
- Pre-configuring a shared visual style for teams
- Providing a consistent starting point for new users

## How It Works

On startup, Graph Explorer fetches `defaultStyling.json` and merges its values
into the user's per-type styling preferences (stored in IndexedDB). Default
values fill in any properties the user hasn't explicitly set — existing user
overrides are preserved.

When no `defaultStyling.json` is mounted, behavior is identical to the default
Graph Explorer experience. When mounted, it populates the per-type styling that
users can then customize. Resetting a vertex or edge style in the UI will revert
to the `defaultStyling.json` values (or the hardcoded application defaults if no
entry exists for that type).

## Setup

### Docker

Mount the file into the container's configuration folder:

```bash
docker run \
  -v /path/to/defaultStyling.json:/graph-explorer/packages/graph-explorer/defaultStyling.json \
  public.ecr.aws/neptune/graph-explorer
```

### Custom Icons

To serve custom icon files (referenced by URL in the config), mount an icons
directory:

```bash
docker run \
  -v /path/to/defaultStyling.json:/graph-explorer/packages/graph-explorer/defaultStyling.json \
  -v /path/to/icons:/graph-explorer/packages/graph-explorer/custom-icons \
  public.ecr.aws/neptune/graph-explorer
```

Icons in the `custom-icons` directory are served at `/custom-icons/<filename>`.

## JSON Schema

```json
{
  "vertices": {
    "<VertexTypeLabel>": {
      "color": "#hex",
      "icon": "lucide-icon-name",
      "iconUrl": "url-or-base64",
      "iconImageType": "image/svg+xml",
      "shape": "ellipse",
      "displayLabel": "Custom Label",
      "displayNameAttribute": "name",
      "longDisplayNameAttribute": "description",
      "backgroundOpacity": 0.4,
      "borderWidth": 0,
      "borderColor": "#hex",
      "borderStyle": "solid"
    }
  },
  "edges": {
    "<EdgeTypeLabel>": {
      "displayLabel": "Custom Label",
      "displayNameAttribute": "name",
      "labelColor": "#hex",
      "labelBackgroundOpacity": 0.7,
      "labelBorderColor": "#hex",
      "labelBorderStyle": "solid",
      "labelBorderWidth": 0,
      "lineColor": "#hex",
      "lineThickness": 2,
      "lineStyle": "solid",
      "sourceArrowStyle": "none",
      "targetArrowStyle": "triangle"
    }
  }
}
```

All properties are optional — only specify what you want to override. Type
labels must exactly match the vertex/edge type names in your graph database.

### Icons

There are two ways to specify vertex icons:

- **`icon`** — A [Lucide](https://lucide.dev/icons) icon name in kebab-case
  (e.g., `"user"`, `"log-in"`, `"landmark"`). Resolved to an SVG at runtime. No
  additional files needed.
- **`iconUrl`** — A URL or base64 data URI for a custom icon. Use this for
  non-Lucide icons. If both `icon` and `iconUrl` are specified, `iconUrl` takes
  precedence.

### Vertex Shapes

Available shapes: `ellipse`, `rectangle`, `diamond`, `triangle`, `pentagon`,
`hexagon`, `heptagon`, `octagon`, `star`, `barrel`, `vee`, `rhomboid`, `tag`,
`round-rectangle`, `round-triangle`, `round-diamond`, `round-pentagon`,
`round-hexagon`, `round-heptagon`, `round-octagon`, `round-tag`,
`cut-rectangle`, `concave-hexagon`.

### Line Styles

Available for edges and borders: `solid`, `dashed`, `dotted`.

### Arrow Styles

Available for `sourceArrowStyle` and `targetArrowStyle`: `triangle`,
`triangle-tee`, `circle-triangle`, `triangle-cross`, `triangle-backcurve`,
`tee`, `vee`, `square`, `circle`, `diamond`, `none`.

## Common Lucide Icons for Graph Use Cases

| Use Case             | Icon Name                         |
| -------------------- | --------------------------------- |
| Person / User        | `user`                            |
| Account / Bank       | `landmark`                        |
| Email                | `mail`                            |
| Phone                | `phone`                           |
| Login / Auth         | `log-in`                          |
| Device               | `monitor`, `laptop`, `smartphone` |
| IP Address / Network | `globe`, `network`                |
| Transaction          | `arrow-left-right`                |
| Location             | `map-pin`                         |
| Organization         | `building`                        |
| Alert                | `shield-alert`, `triangle-alert`  |
| Document             | `file-text`                       |
| Calendar / Date      | `calendar`                        |
| Lock / Security      | `lock`, `shield`                  |
| Database             | `database`                        |
| Server               | `server`                          |
| Link / Relationship  | `link`                            |

See the full list at [lucide.dev/icons](https://lucide.dev/icons).

## Import / Export / Reset

The Settings page provides styling management:

- **Export Styling** — exports the current per-type styling as a
  `defaultStyling.json` file, for sharing or Docker-mounting as team defaults.
- **Import Styling** — imports a `defaultStyling.json` file. This is an
  alternative to mounting the file in Docker.
- **Reset All Styling** — resets all styling to defaults. If a
  `defaultStyling.json` is mounted, those values are restored; otherwise,
  styling reverts to the application defaults.

Per-type reset is also available in the Node/Edge Style dialogs via the "Reset
to Default" button.

## Example

See [`example/defaultStyling.json`](../example/defaultStyling.json) for a
complete example with banking-oriented vertex and edge types.
