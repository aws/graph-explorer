[← Features](./)

# Settings

## General Settings

- **Default Neighbor Expansion Limit:** This setting will allow you to enable or disable the default limit applied during neighbor expansion. This applies to both double click expansion and the expand sidebar. This setting can be overridden by a similar setting on the connection itself.
- **Save Configuration:** This action will export all the configuration data within the Graph Explorer local database. This will not store any data from the connected graph databases. However, the export may contain the shape of the schema for your databases and the connection URL.
- **Load Configuration:** This action will replace all the Graph Explorer configuration data you currently have with the data in the provided configuration file. This is a destructive act and can not be undone. It is **strongly** suggested that you perform a **Save Configuration** action before performing a **Load Configuration** action to preserve any existing configuration data.

## Styles

The Styles settings page lets you manage your styling configuration — the colors, shapes, icons, and other visual properties applied to vertex and edge types in the graph view.

Graph Explorer uses a three-layer cascade to determine how each type looks:

1. **Custom styles** (highest priority) — per-type edits you make in the style dialogs
2. **Shared styles** — loaded from a file via this settings page
3. **App defaults** — the built-in fallback styles

When you customize a type in the style dialog, that change only affects your custom layer. Shared styles fill in where you haven't customized.

### Save styles to share

Saves your current effective styles (custom and shared, merged) to `graph-explorer.styles.json`. Loading this file on another machine or browser reproduces your full visual configuration.

### Load shared styles

Loads a styling file and merges it into your shared styles. Your custom styles are not affected — they continue to take priority. If there are no conflicts the file is applied immediately; if the file contains types that already have shared styles, you'll see a confirmation listing the types that will be replaced before anything changes. Types not in the file are left unchanged. The page shows an indicator of how many types currently have shared styles.

Loading is all-or-nothing: if the file contains any invalid value, nothing is loaded and you'll see a report listing every offending type and field so you can fix the file and load it again. Icons must be Lucide references (`lucide:<name>`) or base64-encoded data URIs; remote URLs are rejected. Unrecognized or extra fields are ignored silently (this is how a file from a newer version still loads), so a file whose entries contain only unrecognized fields loads nothing and reports that no styles were found.

### Reset custom styles

Clears all your per-type style customizations. After this, types will show their shared styles (if any) or the app defaults. This cannot be undone — consider saving first.

### Reset shared styles

Removes all shared styles. Your custom styles remain unaffected.

## About

In the _About_ page you can see the version number and submit any feedback.
