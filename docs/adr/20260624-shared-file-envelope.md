# ADR — Shared file envelope for import/export formats

- **Status:** Accepted
- **Date:** 2026-06-24
- **Related:** ADR `styling-file-format-and-salvaging-import` (first consumer beyond connection export). `saveConfigurationToFile` in `utils/saveConfigurationToFile.ts` (predecessor pattern that predates this envelope).

## Context

Graph Explorer already exports several kinds of data to JSON files, and the same `{meta, data}` envelope shape was independently reinvented more than once:

- **Graph export** (`modules/GraphViewer/exportedGraph.ts`) had this exact envelope inline: `meta: { kind, version, timestamp, source, sourceVersion }` wrapping a `data` payload. It was the prior art the shared module generalizes, and now **consumes** the module — `createExportedGraph` calls `createFileEnvelope("graph-export", "1.0", …)` and `parseExportedGraph(blob)` runs through `parseFileEnvelope`'s kind + version guard before validating its payload and sanitizing entity ids.
- **Backup** (`SerializedBackupSchema` in `localDb.ts`) uses the same five concepts with renamed fields (`backupSource`, `backupSourceVersion`, `backupVersion`, `backupTimestamp`, `data`).
- **Connection export** (`saveConfigurationToFile`) is the outlier — a flat `{ id, displayLabel, connection, schema }` with no envelope at all.

A new styling import/export feature needs the same structural concerns: identifying what the file contains, which version of the format was used, and when it was created. Rather than reinvent the metadata shape a fourth time, the styling feature adopts a shared envelope, and the module documents the canonical shape so the next consumer reuses it instead of hand-rolling another copy.

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

3. **`kind` discriminates the file type.** Known kinds today: `"styling-export"`. Each `kind` has its own payload schema, validated by the caller. The caller passes the `kind` it expects; the envelope rejects a mismatch with a clear error so a wrong-kind file (e.g. a connection export) is never silently misinterpreted.

4. **`version` is a single-integer format generation** of the payload schema, not the app version. The `sourceVersion` field carries the app version for diagnostics. It bumps **only on a breaking change** (a renamed or removed field). Additive changes ship as new optional fields and do **not** bump it — an older build simply ignores fields it doesn't know (see #5 and the styling ADR). There is therefore no "minor" concept. It is written to disk as `"1.0"` for historical reasons and read back as the leading integer (`1`), which also tolerates that legacy decimal string.

5. **`parseFileEnvelope` guards `kind` and `version`.** The caller passes an `EnvelopeExpectation` (`{ kind, supportedVersion }`). The envelope:
   - rejects a mismatched `kind`,
   - rejects a file whose `version` is newer than the build supports — turning "a file from a future Graph Explorer" into one clear error instead of a confusing partial import,
   - accepts the same or an older generation; the per-kind payload parser ignores any unrecognized fields a newer build of the same generation may have added.

6. **Helpers:**
   - `createFileEnvelope(kind, version, data)` — stamps `timestamp`, `source` ("Graph Explorer"), and `sourceVersion` from the build constant.
   - `parseFileEnvelope(blob, expectation)` — reads JSON, validates the outer envelope schema, guards kind + version, and returns `{ meta, data }` without validating the payload (caller validates `data` per `kind`).

   Callers compose the envelope with their own file-save logic (e.g., `toJsonFileData` + `saveFile` from `utils/fileData`), and own a named version pair (e.g. `STYLING_EXPORT_VERSION` written to disk / `STYLING_EXPORT_SUPPORTED_VERSION` read back) so the bumpable value lives next to the payload schema.

### Future shape: discriminated union on kind + version

Today there is one payload schema per kind and the guard is the only version-aware code. When a breaking **v2** payload arrives, the consumer selects its schema by discriminating on `(kind, version)` — the guard already supplies a validated integer version for that switch. The envelope stays a thin gate; the kind-specific dispatch lives in the consumer, not a registry in the envelope.

### Why a separate module (not inline in the styling code)

The `{meta, data}` envelope already exists independently in graph export (`exportedGraph.ts`) and, with renamed fields, in backup (`SerializedBackupSchema`). Extracting the canonical shape into `core/fileEnvelope/` gives the next consumer a reuse path instead of a fourth hand-rolled copy.

### Migration status of the other consumers

- **Graph export** — migrated. Its file format was already byte-identical to the envelope (same `kind`, same `version: "1.0"`, same five meta fields), so adopting the module is a pure refactor with no on-disk change: files written before and after the migration parse identically. Adopting `parseFileEnvelope` also upgraded it from an exact `z.literal("1.0")` match (which would have rejected any future generation) to the shared version guard.
- **Backup** — left alone. Would require renaming persisted fields (`backupVersion` → `version`, …) on the disaster-recovery restore path — a data migration, not a refactor.
- **Connection export** — left alone. Flat (no envelope); wrapping it nests the file one level deeper, so every previously-exported file becomes unreadable unless the importer detects both shapes forever. That is a deliberate versioned format break, not a "backward-compatible follow-up," and is out of scope here.

### Why not reuse `SerializedBackupSchema` from `localDb.ts`

The backup format (`graph-explorer-config.json`) dumps the entire IndexedDB store — all keys, all values, no per-kind typing. It serves disaster recovery, not feature-level import/export. The envelope serves typed, single-purpose files. They have different validation needs and audiences.

## Consequences

- New file-based import/export features get metadata handling and version-guarding for free — they only define their payload schema, `kind` string, and supported version.
- A wrong-kind or too-new file produces one clear, actionable error instead of a confusing partial import.
- `parseFileEnvelope` returns the payload as `unknown` — the caller is responsible for kind-specific validation. This keeps the envelope layer thin and avoids a registry pattern.
