// @vitest-environment happy-dom
import { renderHook } from "@testing-library/react";
import { toast } from "sonner";

import { useReportUserStylingMigrationFailure } from "./useReportUserStylingMigrationFailure";
import {
  markUserStylingMigrationFailed,
  resetUserStylingMigrationStatus,
} from "./userStylingMigrationStatus";

describe("useReportUserStylingMigrationFailure", () => {
  afterEach(() => {
    resetUserStylingMigrationStatus();
  });

  it("does not notify when the migration succeeded", () => {
    renderHook(() => useReportUserStylingMigrationFailure());

    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("warns the user when the migration failed", () => {
    markUserStylingMigrationFailed();

    renderHook(() => useReportUserStylingMigrationFailure());

    expect(toast.warning).toHaveBeenCalledWith(
      "Couldn't load your saved display customizations",
      expect.objectContaining({
        description: expect.stringContaining("preserved"),
      }),
    );
  });
});
