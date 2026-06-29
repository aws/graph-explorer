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

Any other value (bare names, `javascript:`, relative paths, **and `http(s)://` URLs**) fails validation, which drops the whole entry and reports one issue. Remote URLs are intentionally rejected: importing a file should never cause the app to issue outbound requests to a host chosen by the file's author. Only `icon` is accepted as an input field — `iconUrl` (the storage-model name) is not a known field, so a file supplying it has that key stripped silently and it never reaches storage.

`iconImageType` is constrained to known image MIME types: `image/svg+xml`, `image/png`, `image/jpeg`, `image/gif`, `image/webp`. An unknown value fails validation and drops its entry.

### Per-entry parser contract

> **Superseded note.** This started as a _salvaging, per-field_ parser (each field validated independently; bad fields dropped and reported; unknown fields flagged as typos). That was reverted to **whole-entry** validation. Rationale: these files are produced by export, not hand-authored, so per-field typo detection and partial-entry salvage earned little, while costing a hand-rolled validation loop and risking confusingly half-styled types. The filename retains "salvaging" for stable links.

The parser validates each entry **as a whole**. Contract:

```ts
function parseStylingPayload(rawData: unknown): StylingParseResult; // throws on structural failure

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

- Throws `StylingParseError` only on structural failure (not a record of entries at the top level). The caller treats this as a hard failure.
- Whole-entry validation: each entry is parsed by a single Zod object schema of all-optional known fields. If **any** known field has an invalid value, the **entire entry** is dropped and one `issue` is reported for it — no half-styled types.
- Unknown fields are **stripped silently** (Zod's default object behavior). No typo detection, no warning. This is also the forward-compatibility mechanism: a file from a newer build of the same version carries extra fields the current build ignores.
- A `looseObject` is deliberately **not** used: it would let a file inject `iconUrl` (a remote URL) as a passthrough field and bypass the icon allowlist. Stripping unknowns closes that.
- Empty entries (no recognized fields after stripping) are skipped — they would be no-ops.

### Export semantics

Export produces the **effective merged view**: for each type that has either user or imported styling, the output is `{ ...importedMap.get(type), ...userMap.get(type) }` with user fields winning on conflict. Re-importing this file on a fresh machine reproduces the full visual appearance.

### Import semantics

Import writes to the **imported layer** (`importedVertexStylesAtom` / `importedEdgeStylesAtom`) — it is **non-destructive** to user customizations. The user layer is untouched. If the user has customized a field that the import also specifies, the user's value wins in the cascade (user layer has higher precedence).

Import **merges** into the existing imported layer rather than replacing it: each type in the file is set onto the current imported map, and types not present in the file are retained. When the file specifies a type that already has an imported default, that overlap is surfaced via `getConflicts` and the user confirms before the overwrite proceeds. This lets a user assemble imported defaults from several files while still being warned before any existing imported default is overwritten.

## Consequences

- **Per-entry resilience, not per-field.** A file with 50 valid entries and 2 corrupt ones imports the 50 and reports the 2. A corrupt _field_ drops its whole entry (not just that field), so a type is either styled as the file intended or left at defaults — never a confusing partial blend.
- **Forward-compatible without minor versions.** Unknown fields in `meta` are preserved (looseObject); unknown fields in payload entries are stripped. A newer exporter that adds an optional field (e.g., `glow`) produces a file that older importers consume cleanly, ignoring the field — so additive changes never bump the version (see the shared-envelope ADR).
- **No XSS surface.** Icon URLs are allowlisted; only a validated `icon` becomes the stored `iconUrl`, and any `iconUrl` supplied directly in the file is stripped, so the allowlist cannot be bypassed. SVG content fetched from URLs is sanitized by DOMPurify at the render sink (separate from this parser).
- **The `icon` → `iconUrl` rename at the seam** keeps the file format user-friendly (`icon` is the natural name in a config file) while the storage model uses the more precise `iconUrl` internally. This rename happens in the entry schema's `.transform()`, not spread across consumers.
- **Coverage stays high.** The parser and icon validation are contract-tested by driving every accepted shape, line, and arrow value through `parseStylingPayload`, asserting whole-entry rejection on a bad field, and asserting unknown fields (including `iconUrl`) are stripped without error. Any field addition or rename forces a test update.
