import { QueryClientProvider } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router";

import { TooltipProvider } from "@/components";
import { Toaster } from "@/components/Toaster";
import {
  diagnosticLoggingAtom,
  useReportUserStylingMigrationFailure,
} from "@/core";
import AppErrorPage from "@/core/AppErrorPage";
import AppStatusLoader from "@/core/AppStatusLoader";
import { setDiagnosticLogging } from "@/utils/logger";

import { createQueryClient } from "../core/queryClient";

const queryClient = createQueryClient();

/** Bridges the diagnosticLogging Jotai atom to the logger's module-level flag. */
function useSyncDiagnosticLogging() {
  const enabled = useAtomValue(diagnosticLoggingAtom);
  useEffect(() => {
    setDiagnosticLogging(enabled);
    return () => setDiagnosticLogging(false);
  }, [enabled]);
}

/**
 * The default layout for the app, which sets up the query client, a global
 * error boundary, and other app wide services.
 */
export default function DefaultLayout() {
  useSyncDiagnosticLogging();
  useReportUserStylingMigrationFailure();

  return (
    <ErrorBoundary FallbackComponent={AppErrorPage}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <AppStatusLoader>
            <Outlet />
            <Toaster />
          </AppStatusLoader>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
