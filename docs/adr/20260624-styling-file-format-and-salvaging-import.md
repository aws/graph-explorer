# ADR — Styling file format and salvaging import contract

- **Status:** Accepted
- **Date:** 2026-06-24
- **Related:** ADR `shared-file-envelope` (the outer envelope this payload lives inside). ADR `type-keyed-map-atoms-for-user-preferences` (the Map storage shape that the imported layer mirrors). Issue #1866 (Preferences → Styles rename — deferred, not bundled here).

## Context

Users want to share styling configurations across machines and team members. The feature needs a file format that is stable enough to share, resilient enough to survive partial corruption or forward-incompatible additions, and secure enough that importing a file from an untrusted source does not introduce XSS vectors through icon URLs or SVG content.

## Decision

### File format

The styling export file uses the shared file envelope (ADR `shared-file-envelope`) with `kind: "styling-export"`, `version: "1.0"`. The payload shape:

```ts
type StylingExportPayload = {
  vertices: Record<string, VertexStyleFileEntry>;
  edges: Record<string, Omit<EdgePreferencesStorageModel, "type">>;
};

type VertexStyleFileEntry = Omit<
  VertexPreferencesStorageModel,
  "type" | "iconUrl"
> & { icon?: string };
```

Vertex and edge entries mirror `VertexPreferencesStorageModel` / `EdgePreferencesStorageModel` minus the `type` field (the type is the Record key). The vertex entry additionally renames `iconUrl` → `icon` at this seam (see below). Fields are all optional — a partial entry is valid (only the specified fields override defaults). These types live in `useStylingImportExport.ts`.

### Icon security

The icon field (named `icon` in the file format, mapped to `iconUrl` at the storage-model seam) is validated against an allowlist regex:

- `lucide:<name>` — built-in Lucide icon references (alphanumeric + hyphens only after prefix)
- `data:image/<type>;base64,` — inline base64 data URIs with image MIME types

Any other value (bare names, `javascript:`, relative paths, **and `http(s)://` URLs**) is dropped and reported as an import issue. Remote URLs are intentionally rejected: importing a file should never cause the app to issue outbound requests to a host chosen by the file's author. Only `icon` is accepted as an input field — `iconUrl` (the storage-model name) is not a valid file field.

`iconImageType` is constrained to known image MIME types: `image/svg+xml`, `image/png`, `image/jpeg`, `image/gif`, `image/webp`. Unknown values are dropped; the icon falls through to default `<img>` rendering behavior.

### Salvaging parser contract

The parser is **salvaging** — it extracts as much valid data as possible rather than failing on the first bad field. Contract:

```ts
function parseStylingPayload(rawData: unknown): StylingParseResult | null;

type StylingParseResult = {
  vertexStyles: Map<VertexType, VertexPreferencesStorageModel>;
  edgeStyles: Map<EdgeType, EdgePreferencesStorageModel>;
  issues: ImportIssue[];
};

type ImportIssue = {
  entityType: "vertex" | "edge";
  typeName: string;
  field: string;
  message: string;
};
```

- Returns `null` only on structural envelope failure (not valid JSON, missing `vertices`/`edges` keys, wrong types at the top level). The caller treats `null` as a hard failure.
- Per-field validation: each field is independently checked. An invalid field is dropped from the entry (falls through to default), reported in `issues`, and does not affect other fields in the same entry or other entries.
- Unknown fields are reported as issues (typo detection) but do not cause entry rejection.
- Empty entries (all fields invalid or unknown) are dropped entirely — they would be no-ops.

### Export semantics

Export produces the **effective merged view**: for each type that has either user or imported styling, the output is `{ ...importedMap.get(type), ...userMap.get(type) }` with user fields winning on conflict. Re-importing this file on a fresh machine reproduces the full visual appearance.

### Import semantics

Import writes to the **imported layer** (`importedVertexStylesAtom` / `importedEdgeStylesAtom`) — it is **non-destructive** to user customizations. The user layer is untouched. If the user has customized a field that the import also specifies, the user's value wins in the cascade (user layer has higher precedence).

Import **merges** into the existing imported layer rather than replacing it: each type in the file is set onto the current imported map, and types not present in the file are retained. When the file specifies a type that already has an imported default, that overlap is surfaced via `getConflicts` and the user confirms before the overwrite proceeds. This lets a user assemble imported defaults from several files while still being warned before any existing imported default is overwritten.

## Consequences

- **Partial imports are useful, not errors.** A file with 50 valid entries and 2 corrupt ones imports the 50 and reports the 2. Users see exactly what was wrong and can fix the source file.
- **Forward-compatible.** Unknown fields in `meta` are preserved (looseObject). Unknown fields in payload entries are reported but don't break parsing. A newer exporter adding fields (e.g., `glow`, `animation`) produces a file that older importers can partially consume.
- **No XSS surface.** Icon URLs are allowlisted; SVG content fetched from URLs is sanitized by DOMPurify at the render sink (separate from this parser). The parser's job is preventing obviously-malicious URLs from entering storage.
- **The `icon` → `iconUrl` rename at the seam** keeps the file format user-friendly (`icon` is the natural name in a config file) while the storage model uses the more precise `iconUrl` internally. This seam is in the parser, not spread across consumers.
- **Coverage thresholds stay or rise.** The salvaging parser and icon validation are contract-tested by driving every accepted shape, line, and arrow value through `parseStylingPayload` and asserting rejection of unknown values. Any field addition or rename is a deliberate decision that forces a test update.
