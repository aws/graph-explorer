import { atom } from "jotai";

import type { UserStyling } from "./userPreferences";

/**
 * Read-only reference copy of the resolved styling from defaultStyling.json.
 *
 * On load, the file values are written into userStylingAtom (for types without
 * existing overrides). This atom is kept only as a reference so that per-type
 * "Reset to Default" can restore the file's original values.
 *
 * NOT persisted to LocalForage. Re-fetched each session. Remains null when
 * no defaultStyling.json is mounted.
 */
export const defaultStylingAtom = atom<UserStyling | null>(null);
