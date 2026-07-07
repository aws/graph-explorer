# ADR — Shared file envelope for import/export formats

- **Status:** Accepted
- **Date:** 2026-06-24
- **Related:** ADR `styling-file-format` (first consumer beyond connection export). `saveConfigurationToFile` in `utils/saveConfigurationToFile.ts` (predecessor pattern that predates this envelope).

## Context

Graph Explorer already exports several kinds of data to JSON files, and the same `{meta, data}` envelope shape was independently reinvented more than once:

- **Graph export** (`modules/GraphViewer/exportedGraph.ts`) had this exact envelope inline: `meta: { kind, version, timestamp, source, sourceVersion }` wrapping a `data` payload. It was the prior art the shared module generalizes, and now **consumes** the module — `createExportedGraph` calls `createFileEnvelope("graph-export", "1.0", …)` and `parseExportedGraph(blob)` runs through `parseFileEnvelope`'s kind + version guard before validating its payload and sanitizing entity ids.
- **Backup** (`SerializedBackupSchema` in `localDb.ts`) uses the same five concepts with renamed fields (`backupSource`, `backupSourceVersion`, `backupVersion`, `backupTimestamp`, `data`).
- **Connection export** (`saveConfigurationToFile`) is the outlier — a flat `{ id, displayLabel, connection, schema }` with no envelope at all.

A new styling import/export feature needs the same structural concerns: identifying what the file contains, which version of the format was used, and when it was created. Rather than reinvent the metadata shape a fourth time, the styling feature adopts a shared envelope, and the module documents the canonical shape so the next consumer reuses it instead of hand-rolling another copy.

## Decision

A shared **file envelope** primitive lives in `packages/graph-explorer/src/core/fileEnvelope/`. It provides:

1. **Separate write and read contracts.** Every export writes the full metadata; the reader validates only the fields it acts on.

   ```ts
   // Write contract — what createFileEnvelope stamps and what lands on disk:
   meta: { kind: string, version: EnvelopeVersion, timestamp: string, source: string, sourceVersion: string }
   // EnvelopeVersion = number | "1.0" — the wire form; see #4 for why "1.0" exists

   // Read contract — the only fields parseFileEnvelope validates and returns:
   meta: { kind: string, version: number }  // wire version normalized to the integer generation
   data: T  // payload — validated separately per kind
   ```

2. **The read schema keeps only the load-bearing fields.** `kind` selects the expected file type and `version` selects the payload generation — those gate behavior. `timestamp`/`source`/`sourceVersion` are diagnostic only: nothing reads them back, so the read schema does not require or validate them and `z.object()` strips them (along with any unknown field). Consequences: a newer exporter that adds a `meta` field still imports cleanly (dropped, not rejected); a file that omits or malforms a diagnostic field still imports (it is not validated); and no field beyond `kind`/`version` survives into the parsed envelope. They remain part of the write contract because a human inspecting the file still wants them.

3. **`kind` discriminates the file type.** Known kinds today: `"styling-export"`, `"graph-export"`. Each `kind` has its own payload schema, validated by the caller. The caller passes the `kind` it expects; the envelope rejects a mismatch with a clear error so a wrong-kind file (e.g. a connection export) is never silently misinterpreted.

4. **`version` is a single-integer format generation** of the payload schema, not the app version. The `sourceVersion` field carries the app version for diagnostics. It bumps **only on a breaking change** (a renamed or removed field). Additive changes ship as new optional fields and do **not** bump it — an older build simply ignores fields it doesn't know (see #5 and the styling ADR). There is therefore no "minor" concept. The read schema accepts either the integer generation or the `"1.0"` decimal string, normalizing the latter to `1`. Every other form — `"1.5"`, `"2.0"`, `"banana"`, `0` — fails structural parsing, so a malformed version is rejected at the schema level rather than by a later guard.

   **The version's on-disk _wire form_ is per-kind, and it is not always the integer.** The value a writer stamps (`EnvelopeVersion` = `z.input` of the version schema = `number | "1.0"`) is separate from the normalized integer generation the reader dispatches on:

   - **`graph-export`** has an installed base: builds predating this envelope validate `version` as the exact literal `"1.0"` (`z.literal("1.0")`). If new files wrote the integer `1`, those older builds would reject them — a silent forward-compatibility break in the direction the migration below did _not_ consider. So graph-export deliberately keeps writing the `"1.0"` decimal string at generation 1 (`GRAPH_EXPORT_WIRE_VERSION`), accepting a permanent decimal-string wart on that one format to preserve old-build read compatibility. Its generation integer (`GRAPH_EXPORT_VERSION = 1`) is a separate constant used only for the read guard and payload dispatch.
   - **`styling-export`** is new and has no pre-integer installed base, so it writes the clean integer `1` (`STYLING_EXPORT_VERSION`), which serves as both wire form and generation.

   A future breaking **v2** of either kind writes the integer `2` — the decimal-string form is a generation-1 artifact of graph-export's history, not a scheme that continues.

5. **`parseFileEnvelope` guards `kind` and `version`.** The caller passes an `EnvelopeExpectation` (`{ kind, supportedVersion }`). The envelope:
   - rejects a mismatched `kind`,
   - rejects a file whose `version` is newer than the build supports — turning "a file from a future Graph Explorer" into one clear error instead of a confusing partial import,
   - accepts the same or an older generation; the per-kind payload parser ignores any unrecognized fields a newer build of the same generation may have added.

6. **Helpers:**
   - `createFileEnvelope(kind, version, data)` — stamps `timestamp`, `source` ("Graph Explorer"), and `sourceVersion` from the build constant.
   - `parseFileEnvelope(blob, expectation)` — reads JSON, validates the outer envelope schema (including version format), guards kind + version, and returns the parsed `{ meta, data }` without validating the payload (caller validates `data` per `kind`). The normalized integer generation lives at `meta.version` for the consumer's version dispatch.

   Callers compose the envelope with their own file-save logic (e.g., `toJsonFileData` + `saveFile` from `utils/fileData`), and own a named generation constant (e.g. `STYLING_EXPORT_VERSION`) for the newest generation the build reads, so the bumpable value lives next to the payload schema. When a format's wire form differs from its generation integer (graph-export — see #4), it owns a second constant for the value written to disk (`GRAPH_EXPORT_WIRE_VERSION`).

### Version dispatch in the consumer

`parseFileEnvelope` exposes the validated integer generation at `meta.version`, and each consumer routes its payload through a `…ForVersion(version, data)` switch (`parseStylingPayloadForVersion`, `parseGraphExportPayloadForVersion`) that maps a generation to its parser. Today only `case 1` exists; the `default` throws `FileEnvelopeError`. This is deliberate: the envelope guard already rejects a generation newer than the build supports, so a supported-but-unhandled generation is a programming error, and the switch surfaces it loudly instead of letting the current schema silently strip renamed or retyped fields. When a breaking **v2** payload arrives, the consumer adds a `case 2` beside the existing one — the envelope stays a thin gate and the kind-specific dispatch lives in the consumer, not a registry in the envelope.

### Why a separate module (not inline in the styling code)

The `{meta, data}` envelope already exists independently in graph export (`exportedGraph.ts`) and, with renamed fields, in backup (`SerializedBackupSchema`). Extracting the canonical shape into `core/fileEnvelope/` gives the next consumer a reuse path instead of a fourth hand-rolled copy.

### Migration status of the other consumers

- **Graph export** — migrated. Its file format was already structurally identical to the envelope (same `kind`, same five meta fields, `version: "1.0"` on disk), so adopting the module is a pure refactor: files written before the migration still parse (the `"1.0"` string normalizes to `1`), and new files **keep writing `"1.0"`** so that builds predating the envelope — which validate `version` as the literal `"1.0"` — can still import files this build writes (see #4). Adopting `parseFileEnvelope` also upgraded the reader from an exact `z.literal("1.0")` match (which would have rejected any future generation) to the shared version guard, so this build reads both the `"1.0"` string and the integer form; only the wire form it _writes_ stays `"1.0"`.
- **Backup** — left alone. Would require renaming persisted fields (`backupVersion` → `version`, …) on the disaster-recovery restore path — a data migration, not a refactor.
- **Connection export** — left alone. Flat (no envelope); wrapping it nests the file one level deeper, so every previously-exported file becomes unreadable unless the importer detects both shapes forever. That is a deliberate versioned format break, not a "backward-compatible follow-up," and is out of scope here.

### Why not reuse `SerializedBackupSchema` from `localDb.ts`

The backup format (`graph-explorer-config.json`) dumps the entire IndexedDB store — all keys, all values, no per-kind typing. It serves disaster recovery, not feature-level import/export. The envelope serves typed, single-purpose files. They have different validation needs and audiences.

## Consequences

- New file-based import/export features get metadata handling and version-guarding for free — they only define their payload schema, `kind` string, and supported version.
- A wrong-kind or too-new file produces one clear, actionable error instead of a confusing partial import.
- `parseFileEnvelope` returns the payload as `unknown` — the caller is responsible for kind-specific validation. This keeps the envelope layer thin and avoids a registry pattern.
- A format's on-disk wire form can differ from its generation integer, and that choice belongs to the consumer, not the envelope. `graph-export` writes `"1.0"` to stay readable by pre-envelope builds; `styling-export` writes `1`. A future reader must not assume `meta.version` is always an integer on disk (it is, however, always an integer _after_ normalization). Do not "clean up" graph-export's `"1.0"` to an integer without accepting that older builds can no longer read new files.
