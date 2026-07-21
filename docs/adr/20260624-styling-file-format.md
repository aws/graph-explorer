# ADR — Styling file format and atomic import contract

- **Status:** Accepted
- **Date:** 2026-06-24
- **Updated:** 2026-07-06 — the Preferences → Styles rename (#1866) has since shipped. The decision below is unchanged; read `VertexPreferencesStorageModel`→`VertexStyleStorage` and `EdgePreferencesStorageModel`→`EdgeStyleStorage`.
- **Updated:** 2026-07-20 — the styles cascade collapsed to a single user layer (#1974). Import and export now target the user styles (`userVertexStylesAtom` / `userEdgeStylesAtom`) directly; the never-shipped shared layer was removed with no data migration. The file format itself is unchanged.
- **Updated:** 2026-07-21 — import is now selective (#1972). The whole-file confirm dialog and `getStylingConflicts` are gone; see the rewritten Import semantics below. The file format and atomic-parser contract are unchanged.
- **Related:** ADR `shared-file-envelope` (the outer envelope this payload lives inside). ADR `type-keyed-map-atoms-for-user-preferences` (the Map storage shape the user styles mirror). Issue #1866 (Preferences → Styles rename).

## Context

Users want to share styling configurations across machines and team members. The feature needs a file format that is stable enough to share, resilient enough to survive forward-incompatible additions, and secure enough that importing a file from an untrusted source does not introduce XSS vectors through icon URLs or SVG content.

## Decision

### File format

The styling export file uses the shared file envelope (ADR `shared-file-envelope`) with `kind: "styling-export"`, `version: 1`. The payload is `{ vertices, edges }`, each a `Record` keyed by type name whose entries mirror the stored style minus the `type` field. `stylingParser.ts` is the single source of truth for the entry shapes; all entry fields are optional (a partial entry overrides only the fields it names), and the vertex entry renames `iconUrl` → `icon` at this seam (see Icon security). Do not transcribe the field list here — read the schemas.

### Icon security

The icon field (named `icon` in the file format, mapped to `iconUrl` at the storage-model seam) is validated against an allowlist regex:

- `lucide:<name>` — built-in Lucide icon references (alphanumeric + hyphens only after prefix)
- `data:image/<subtype>;base64,` — inline base64 data URIs with any `image/*` subtype

Any other value (bare names, `javascript:`, relative paths, non-image data URIs like `data:text/html`, **and `http(s)://` URLs**) fails validation, which rejects the whole file and reports one issue against that field. Remote URLs are intentionally rejected: importing a file should never cause the app to issue outbound requests to a host chosen by the file's author. Only `icon` is accepted as an input field — `iconUrl` (the storage-model name) is not a known field, so a file supplying it has that key stripped silently and it never reaches storage.

The image **subtype** is deliberately left open (any RFC-6838-shaped subtype: `svg+xml`, `png`, `bmp`, `x-icon`, …) rather than a fixed list. The uploader stores whatever `image/*` the browser reports (`<input accept="image/*">`), so a closed list would reject the app's own exports on re-import for any less-common type. This is not a weakening: the subtype is not a security boundary — SVG, the only script-capable type, is DOMPurify-sanitized at the render sink regardless of the declared subtype, and every other type renders as an inert raster `<img>`. The one gate is `data:image/*;base64,` vs. a fetchable/executable scheme. **Do not narrow this to a "known-safe types" list** — it buys no security and silently breaks round-trip. The same allowlist is enforced at the upload seam (`isAllowedIconValue`), so what a user can upload and what import accepts come from one source and cannot drift.

`iconImageType` is **not** a security boundary and is stored as a loose `string`. The only consumer that reads it exact-matches `"image/svg+xml"` to choose the DOMPurify-sanitized inline-SVG path; any other value takes the safer raster `<img>` path. It is left unconstrained so an icon uploaded with any browser-reported MIME type round-trips through export and re-import instead of rejecting the whole file.

### Whole-file (atomic) parser contract

`parseStylingPayload` validates the **entire payload in one `safeParse`** (the entry schemas plugged straight into `z.record`) and throws `StylingParseError` carrying **every** offending location on any failure, or returns the parsed styles. Import is atomic — the file imports in full or not at all, and nothing is persisted on failure.

It is deliberately **not** a salvaging (per-field or per-entry) parser. Salvage only buys tolerance of _invalid_ data, which is not a goal for files the app itself produces — a bad value signals a corrupted or hand-edited file the user should fix, not one to import partially. The forward-compatibility salvage might seem to offer is already served by `z.record` openness plus silent unknown-field stripping, so one `safeParse` is both sufficient and simpler (one failure path, no hand-rolled validation loop).

Two supporting choices:

- **Unknown fields are stripped, not preserved (`looseObject` is rejected).** Stripping is the forward-compatibility mechanism (a newer build's extra fields are ignored), and it closes a hole: a `looseObject` would let a file smuggle `iconUrl` (a remote URL) past the `icon` allowlist as a passthrough field.
- **The envelope and payload are separate parse steps.** `parseFileEnvelope` gates `kind`/`version`/JSON validity as a one-message precondition; only a compatible envelope reaches payload validation. Merging them would validate the payload against the wrong file type and emit noisy field issues for what is really a "wrong file" error.

### Export and import semantics

Export writes each type's stored **user style** verbatim (`userVertexStylesAtom` / `userEdgeStylesAtom`); re-importing on a fresh machine reproduces the full appearance.

Import is **selective** (`modules/StyleImport/`). A plan resolves each incoming style against the current one, drops types that resolve identically as no-ops (the skipped count shows in the modal footer), and classifies the rest `new` or `conflict` for before→after cards, all selected by default. Loading writes the checked items to the user styles as **wholesale full-type replacement** — the incoming entry replaces the type's entry outright, not a per-field merge. Unchecked and absent types are untouched. The per-card selection is the confirmation; there is no separate confirm-before-overwrite step.

## Consequences

- **Parse is atomic; load is selective.** A malformed file parses to nothing (reporting every offending location), so the user never lands in a partially-styled state from a bad file. "Not applying every type" is only ever a deliberate per-card choice, never a silent partial parse.
- **Additive changes never bump the version.** A newer exporter adding an optional field (e.g. `glow`) produces a file older importers consume cleanly by stripping the unknown field (see the shared-envelope ADR).
- **The `icon` allowlist is the whole XSS boundary.** Only a validated `icon` becomes a stored `iconUrl`; a directly-supplied `iconUrl` is stripped, and SVG is DOMPurify-sanitized at the render sink. No other field constrains security.
