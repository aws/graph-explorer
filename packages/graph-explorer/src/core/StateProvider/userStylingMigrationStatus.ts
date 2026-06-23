/**
 * The user-styling migration runs at module load (a top-level `await` in
 * `storageAtoms.ts`), long before React mounts, so a failure cannot show a
 * toast at the moment it happens. This module-level flag carries that failure
 * across the boundary so a React hook can surface it to the user once the UI
 * is up. See `useReportUserStylingMigrationFailure`.
 */
let migrationFailed = false;

export function markUserStylingMigrationFailed() {
  migrationFailed = true;
}

export function didUserStylingMigrationFail() {
  return migrationFailed;
}

/** Test-only reset so the module-level flag does not leak between cases. */
export function resetUserStylingMigrationStatus() {
  migrationFailed = false;
}
