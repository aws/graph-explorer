# ADR — Persist exact graph arrangements

- **Status:** Accepted
- **Date:** 2026-09-03
- **Related:** Issue #890; ADR `indexeddb-not-localstorage-for-persistence`; ADR `read-time-transform-for-persisted-values`.

## Context

A layout algorithm name does not reproduce a Graph View reliably. Some algorithms are randomized, deterministic algorithms can depend on entity order, and manual vertex movement is not represented by the algorithm. Restoring a Session therefore requires the selected layout, exact vertex positions, and viewport pan and zoom.

Graph rendering is asynchronous. Layouts, user interaction, Connection changes, overlapping restoration requests, and delayed Cytoscape events can otherwise overwrite a newer Graph Arrangement or write it to the wrong Session.

## Decision

A Session owns an optional Graph Arrangement. Graph export files carry the same optional arrangement so older files and persisted Sessions remain valid.

- Capture positions and viewport after `layoutstop` and `dragfree`. Debounce pan and zoom capture.
- Scope capture and restoration to the target Connection. A restoration token prevents stale or overlapping requests from committing.
- Suppress capture while applying a restoration so programmatic position and viewport changes are not persisted as user changes.
- Apply a complete arrangement after Cytoscape elements exist and skip one automatic layout. For a partial arrangement, preserve matched positions while laying out unmatched vertices.
- Treat restoration revisions as monotonic. Once a newer revision is consumed, an older revision cannot replace it.
- Reconcile Graph Arrangements when Session membership changes: retain positions for surviving vertices, remove deleted positions, and preserve the viewport.
- Reconstruct a requested endpoint-only vertex from a restored edge when a connector cannot materialize vertex details. RDF resources can exist in the visualization without literal properties or an `rdf:type`.
- Validate exported arrangements strictly. Invalid persisted local arrangements are dropped during the read-time transform rather than preventing startup.

## Considered Options

- **Persist only the layout algorithm.** Rejected because it cannot reproduce randomized, order-sensitive, or manually adjusted arrangements.
- **Persist Graph Arrangement as app-global state.** Rejected because Sessions and their visual state belong to a Connection.
- **Always rerun the layout after restoration.** Rejected because it replaces exact positions and causes a visible transition away from the saved arrangement.

## Consequences

- Graph files and previous Sessions can reproduce the saved visualization exactly.
- Fresh Graph View instances apply the active Session's arrangement immediately instead of replaying the layout animation.
- Graph membership changes and incomplete restoration require explicit position reconciliation.
- New capture or restoration paths must preserve Connection and revision guards.
