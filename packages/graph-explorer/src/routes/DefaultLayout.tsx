import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router";

import { TooltipProvider } from "@/components";
import { Toaster } from "@/components/Toaster";
import AppErrorPage from "@/core/AppErrorPage";
import AppStatusLoader from "@/core/AppStatusLoader";

import { ExplorerInjector } from "../core/ExplorerInjector";
import { createQueryClient } from "../core/queryClient";

const queryClient = createQueryClient();

/**
 * The default layout for the app, which sets up the query client, a global
 * error boundary, and other app wide services.
 */
export default function DefaultLayout() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorPage}>
      <QueryClientProvider client={queryClient}>
        <ExplorerInjector />
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
