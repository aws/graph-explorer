# ADR — Shared file envelope for import/export formats

- **Status:** Accepted
- **Date:** 2026-06-24
- **Related:** ADR `styling-file-format-and-salvaging-import` (first consumer beyond connection export). `saveConfigurationToFile` in `utils/saveConfigurationToFile.ts` (predecessor pattern that predates this envelope).

## Context

Graph Explorer already exports connection configurations to JSON files (`saveConfigurationToFile`). A new styling import/export feature needs its own file format. Both share the same structural concerns: identifying what the file contains, which version of the format was used, and when it was created. Without a shared envelope, each feature invents its own metadata shape, making it harder to add future exports (graph snapshots, layout presets) consistently.

## Decision

A shared **file envelope** primitive lives in `packages/graph-explorer/src/core/fileEnvelope/`. It provides:

1. **An envelope schema** — a Zod object wrapping any payload:

   ```ts
   {
     meta: { kind: string, version: string, timestamp: string, source: string, sourceVersion: string },
     data: T  // payload — validated separately per kind
   }
   ```

2. **`meta` uses `z.looseObject()`** — unknown fields are preserved, not stripped. This is forward-compatibility: a newer exporter can add fields (e.g., `exportedBy`) without breaking older importers that ignore them.

3. **`kind` discriminates the file type.** Known kinds today: `"styling-export"`. Connection export adopts the envelope in follow-up work (not this PR). Each `kind` has its own payload schema registered separately.

4. **`version` is the payload schema version**, not the app version. The `sourceVersion` field carries the app version for diagnostics. Semver-style (`"1.0"`) — major bump = breaking, minor = additive.

5. **Helpers:**
   - `createFileEnvelope(kind, version, data)` — stamps `timestamp`, `source` ("Graph Explorer"), and `sourceVersion` from the build constant.
   - `parseFileEnvelope(blob)` — reads JSON, validates the outer envelope schema, returns `{ meta, rawData }` without validating the payload (caller validates `rawData` per `kind`).

   Callers compose the envelope with their own file-save logic (e.g., `toJsonFileData` + `saveFile` from `utils/fileData`).

### Why a separate module (not inline in the styling code)

The envelope is intentionally generic so that the existing connection export and future formats (graph session snapshots, layout exports) can reuse it without coupling to the styling module. Keeping it in `core/fileEnvelope/` makes the reuse path obvious.

### Why not reuse `SerializedBackupSchema` from `localDb.ts`

The backup format (`graph-explorer-config.json`) dumps the entire IndexedDB store — all keys, all values, no per-kind typing. It serves disaster recovery, not feature-level import/export. The envelope serves typed, single-purpose files. They have different validation needs and audiences.

## Consequences

- New file-based import/export features get metadata handling for free — they only define their payload schema and `kind` string.
- The styling import validates `kind === "styling-export"` and rejects other kinds with a clear error, rather than silently misinterpreting a connection export file.
- The existing connection export (`saveConfigurationToFile`) does **not** migrate to this envelope in this PR — that is a separate, backward-compatible follow-up. The envelope is designed so it can wrap the existing connection shape without breaking existing importers (they already use `z.looseObject`).
- `parseFileEnvelope` returns the raw payload as `unknown` — the caller is responsible for kind-specific validation. This keeps the envelope layer thin and avoids a registry pattern.
