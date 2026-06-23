import { useEffect } from "react";
import { toast } from "sonner";

import { didUserStylingMigrationFail } from "./userStylingMigrationStatus";

/**
 * Surfaces a startup user-styling migration failure to the user. The migration
 * runs before React mounts, so the failure is recorded in a module-level flag
 * and reported here once the UI is available.
 *
 * The legacy `"user-styling"` data is never deleted, so the previous styling
 * is preserved on disk and the migration retries on the next reload — hence the
 * reassuring copy rather than a data-loss warning.
 */
export function useReportUserStylingMigrationFailure() {
  useEffect(() => {
    if (!didUserStylingMigrationFail()) {
      return;
    }

    toast.warning("Couldn't load your saved display customizations", {
      description:
        "Your previous settings are preserved and we'll try again the next time you reload.",
    });
  }, []);
}
