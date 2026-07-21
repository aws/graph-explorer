# ADR — Styling file format and atomic import contract

- **Status:** Accepted
- **Date:** 2026-06-24
- **Updated:** 2026-07-06 — the Preferences → Styles rename (#1866) has since shipped. The decision below is unchanged; read `VertexPreferencesStorageModel`→`VertexStyleStorage` and `EdgePreferencesStorageModel`→`EdgeStyleStorage`.
- **Updated:** 2026-07-20 — the styles cascade collapsed to a single user layer (#1974). Import and export now target the user styles (`userVertexStylesAtom` / `userEdgeStylesAtom`) directly; the never-shipped shared layer was removed with no data migration. The file format itself is unchanged.
- **Related:** ADR `shared-file-envelope` (the outer envelope this payload lives inside). ADR `type-keyed-map-atoms-for-user-preferences` (the Map storage shape the user styles mirror). Issue #1866 (Preferences → Styles rename).

## Context

Users want to share styling configurations across machines and team members. The feature needs a file format that is stable enough to share, resilient enough to survive partial corruption or forward-incompatible additions, and secure enough that importing a file from an untrusted source does not introduce XSS vectors through icon URLs or SVG content.

## Decision

### File format

The styling export file uses the shared file envelope (ADR `shared-file-envelope`) with `kind: "styling-export"`, `version: 1`. The payload shape:

```ts
type StylingExportPayload = {
  vertices: Record<string, VertexStyleFileEntry>;
  edges: Record<string, EdgeStyleFileEntry>;
};
```

`VertexStyleFileEntry` and `EdgeStyleFileEntry` are inferred from the entry schemas' `z.input` (pre-transform), so the file format has a single source of truth in `stylingParser.ts`. Vertex and edge entries mirror `VertexPreferencesStorageModel` / `EdgePreferencesStorageModel` minus the `type` field (the type is the Record key). The vertex entry additionally renames `iconUrl` → `icon` at this seam (see below). Fields are all optional — a partial entry is valid (only the specified fields override defaults). `toVertexFileEntry` / `toEdgeFileEntry` produce these entries on export.

### Icon security

The icon field (named `icon` in the file format, mapped to `iconUrl` at the storage-model seam) is validated against an allowlist regex:

- `lucide:<name>` — built-in Lucide icon references (alphanumeric + hyphens only after prefix)
- `data:image/<subtype>;base64,` — inline base64 data URIs with any `image/*` subtype

Any other value (bare names, `javascript:`, relative paths, non-image data URIs like `data:text/html`, **and `http(s)://` URLs**) fails validation, which rejects the whole file and reports one issue against that field. Remote URLs are intentionally rejected: importing a file should never cause the app to issue outbound requests to a host chosen by the file's author. Only `icon` is accepted as an input field — `iconUrl` (the storage-model name) is not a known field, so a file supplying it has that key stripped silently and it never reaches storage.

The image **subtype** is deliberately left open (any RFC-6838-shaped subtype: `svg+xml`, `png`, `bmp`, `x-icon`, …) rather than a fixed list. The uploader stores whatever `image/*` the browser reports (`<input accept="image/*">`), so a closed list would reject the app's own exports on re-import for any less-common type. This is not a weakening: the subtype is not a security boundary — SVG, the only script-capable type, is DOMPurify-sanitized at the render sink regardless of the declared subtype, and every other type renders as an inert raster `<img>`. The one gate is `data:image/*;base64,` vs. a fetchable/executable scheme. **Do not narrow this to a "known-safe types" list** — it buys no security and silently breaks round-trip. The same allowlist is enforced at the upload seam (`isAllowedIconValue`), so what a user can upload and what import accepts come from one source and cannot drift.

`iconImageType` is **not** a security boundary and is stored as a loose `string`, mirroring the storage model. It is descriptive metadata: the only consumer that reads it (`VertexIcon` / `renderNode`) does an exact match on `"image/svg+xml"` to decide whether to render through the inline-SVG path (which is DOMPurify-sanitized) versus the `<img>`/raster path. Any other value simply takes the safer raster path, so constraining the field would not remove an XSS vector — the icon **data** is what matters, and that is guarded by the `icon` allowlist above. It is left unconstrained so that an icon uploaded with any browser-reported MIME type (the upload seam fills it from `file.type`) round-trips through export and re-import instead of rejecting the whole file.

### Whole-file (atomic) parser contract

The parser validates the **entire payload in one `safeParse`** by plugging the entry schemas straight into `z.record`. Import is atomic — the file imports in full or not at all.

It is deliberately **not** a salvaging (per-field or per-entry) parser. Salvage only ever buys tolerance of _invalid_ data, which is not a goal for files the app itself produces — a bad value signals a corrupted or hand-edited file the user should fix, not one to import partially. The forward-compatibility that salvage might seem to offer (new entries, new optional fields from a newer build) is already served by `z.record` openness plus silent unknown-field stripping. So a single `safeParse` over the whole payload is both sufficient and simpler: one failure path, no hand-rolled validation loop, no dual throw-or-return error model.

Contract:

```ts
function parseStylingPayload(rawData: unknown): StylingParseResult; // throws StylingParseError on ANY invalid value

type StylingParseResult = {
  vertexStyles: Map<VertexType, VertexPreferencesStorageModel>;
  edgeStyles: Map<EdgeType, EdgePreferencesStorageModel>;
};

// StylingParseError.issues carries every offending location, already mapped for display.
type ImportIssue = GeneralImportIssue | EntryImportIssue;

type GeneralImportIssue = {
  scope: "general"; // a file-level structural problem (bad/missing container, non-payload input)
  location: string; // e.g. "vertices" or "(file)"
  value: unknown;
  message: string;
};

type EntryImportIssue = {
  scope: "entry";
  entityType: "vertex" | "edge";
  typeName: string;
  field: string; // a field name, or "(entry)" when the whole entry is malformed
  value: unknown;
  message: string;
};
```

- On any validation failure, throws `StylingParseError` carrying **all** issues (every Zod issue mapped, not just the first). Nothing is persisted. A successful return means the whole file is valid.
- Issues are classified by Zod issue **path depth**: a field failure (`["vertices", "Person", "color"]`) becomes an `EntryImportIssue`; a malformed entry (`["vertices", "Person"]`) becomes an `EntryImportIssue` with `field: "(entry)"`; a bad top-level container or non-payload input becomes a `GeneralImportIssue`. The path prefix supplies `entityType`/`typeName`/`field` directly — no separate per-entry loop assembles them.
- Unknown fields are **stripped silently** (Zod's default object behavior). No typo detection, no warning. This is the forward-compatibility mechanism: a file from a newer build of the same version carries extra fields the current build ignores, and new entry types are admitted by `z.record`.
- A `looseObject` is deliberately **not** used: it would let a file inject `iconUrl` (a remote URL) as a passthrough field and bypass the icon allowlist. Stripping unknowns closes that.
- Empty entries (no recognized fields after stripping) are dropped from the result — they would be no-ops.
- The envelope (`parseFileEnvelope`) and payload remain **separate** parse steps. The envelope gates `kind`/`version`/JSON validity as a one-message precondition (`FileEnvelopeError`); only a compatible envelope reaches payload validation. Merging them would run payload validation against the wrong file type and emit noisy field issues for what is really a "wrong file" error.

### Export semantics

Export produces each type's stored **user style** verbatim (`userVertexStylesAtom` / `userEdgeStylesAtom`). Re-importing this file on a fresh machine reproduces the full visual appearance.

### Import semantics

Import writes to the **user styles** (`userVertexStylesAtom` / `userEdgeStylesAtom`).

Import **merges** into the existing user styles rather than replacing them: each type in the file is set onto the current map, and types not present in the file are retained. When the file specifies a type that already has a user style, that overlap is surfaced via `getStylingConflicts` and the user confirms before the overwrite proceeds. This lets a user assemble styles from several files while still being warned before any existing style is overwritten.

## Consequences

- **Atomic, not partial.** A file with any invalid value imports nothing and reports every offending location, so the user fixes the file and re-imports rather than landing in a partially-styled state they did not author. Because import either fully succeeds or fully fails, there is no "imported with warnings" middle state — the UI shows either a conflict prompt, a success, an envelope-level failure, or an invalid-values report.
- **Forward-compatible without minor versions.** Unknown fields are stripped in both `meta` and payload entries. A newer exporter that adds an optional field (e.g., `glow`) produces a file that older importers consume cleanly, ignoring the field — so additive changes never bump the version (see the shared-envelope ADR).
- **No XSS surface.** Icon URLs are allowlisted; only a validated `icon` becomes the stored `iconUrl`, and any `iconUrl` supplied directly in the file is stripped, so the allowlist cannot be bypassed. SVG content fetched from URLs is sanitized by DOMPurify at the render sink (separate from this parser).
- **The `icon` → `iconUrl` rename at the seam** keeps the file format user-friendly (`icon` is the natural name in a config file) while the storage model uses the more precise `iconUrl` internally. This rename happens in the entry schema's `.transform()`, not spread across consumers.
- **Coverage stays high.** The parser and icon validation are contract-tested by driving every accepted shape, line, and arrow value through `parseStylingPayload`, asserting whole-file rejection (with correctly-scoped issues) on a bad field, and asserting unknown fields (including `iconUrl`) are stripped without error. Any field addition or rename forces a test update.
