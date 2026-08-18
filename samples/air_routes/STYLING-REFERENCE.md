# Styling Reference

This document describes the styling file format used by Graph Explorer. The sample `styles.json` in this directory demonstrates a subset of these properties.

## File format

Styling files use the File Envelope format with `kind: "styling-export"` and `version: 1`. The payload is a JSON object with two top-level keys: `vertices` and `edges`.

## Vertex style properties

Each vertex type can have the following optional properties:

- `color` (string): Hex color code, e.g., `"#128EE5"`
- `shape` (string): Node shape (see Shape values below)
- `icon` (string): Icon reference (see Icon formats below)
- `iconImageType` (string): MIME type for the icon, e.g., `"image/svg+xml"`
- `displayLabel` (string): Override label text
- `displayNameAttribute` (string): Attribute to use as the label
- `longDisplayNameAttribute` (string): Attribute to use as the description
- `backgroundOpacity` (number): Opacity from 0 to 1
- `borderWidth` (number): Border width in pixels
- `borderColor` (string): Hex color code for the border
- `borderStyle` (string): Border line style (see Line style values below)

**Example:**

```json
{
  "airport": {
    "color": "#E63946",
    "shape": "round-rectangle",
    "icon": "lucide:plane",
    "iconImageType": "image/svg+xml",
    "displayNameAttribute": "code",
    "longDisplayNameAttribute": "desc"
  }
}
```

## Edge style properties

Each edge type can have the following optional properties:

- `lineColor` (string): Hex color code, e.g., `"#264653"`
- `lineThickness` (number): Line width in pixels
- `lineStyle` (string): Line style (see Line style values below)
- `sourceArrowStyle` (string): Arrow style at the source (see Arrow style values below)
- `targetArrowStyle` (string): Arrow style at the target (see Arrow style values below)
- `displayLabel` (string): Override label text
- `displayNameAttribute` (string): Attribute to use as the label
- `labelColor` (string): Hex color code for the label text
- `labelBackgroundOpacity` (number): Label background opacity from 0 to 1
- `labelBorderColor` (string): Hex color code for the label border
- `labelBorderStyle` (string): Label border line style (see Line style values below)
- `labelBorderWidth` (number): Label border width in pixels

**Example:**

```json
{
  "route": {
    "lineColor": "#264653",
    "lineThickness": 2,
    "lineStyle": "solid",
    "targetArrowStyle": "triangle",
    "displayNameAttribute": "dist"
  }
}
```

## Icon formats

Icons can be specified in two formats:

### Lucide icons (recommended)

Use the `lucide:` prefix followed by the icon name:

```json
{
  "icon": "lucide:plane",
  "iconImageType": "image/svg+xml"
}
```

Lucide icons are bundled with Graph Explorer and always render. See [Lucide icons](https://lucide.dev/icons/) for the full list.

### Base64 data URIs

Embed an image as a base64-encoded data URI:

```json
{
  "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "iconImageType": "image/png"
}
```

The subtype can be any image type (e.g., `image/png`, `image/jpeg`, `image/svg+xml`).

**Security note:** Remote URLs (e.g., `https://example.com/icon.png`) are rejected for security reasons. Only Lucide references and base64 data URIs are allowed.

## Shape values

The following shapes are available:

- `rectangle`
- `roundrectangle`
- `ellipse`
- `triangle`
- `pentagon`
- `hexagon`
- `heptagon`
- `octagon`
- `star`
- `barrel`
- `diamond`
- `vee`
- `rhomboid`
- `tag`
- `round-rectangle`
- `round-triangle`
- `round-diamond`
- `round-pentagon`
- `round-hexagon`
- `round-heptagon`
- `round-octagon`
- `round-tag`
- `cut-rectangle`
- `concave-hexagon`

## Line style values

The following line styles are available:

- `solid`
- `dashed`
- `dotted`

## Arrow style values

The following arrow styles are available:

- `triangle`
- `triangle-tee`
- `circle-triangle`
- `triangle-cross`
- `triangle-backcurve`
- `tee`
- `vee`
- `square`
- `circle`
- `diamond`
- `none`

## All properties are optional

You only need to specify the properties you want to override. Unspecified properties use the app defaults. For example, this is a valid minimal entry:

```json
{
  "airport": {
    "color": "#E63946"
  }
}
```

This sets only the color; all other properties (shape, icon, labels, etc.) use the defaults.
