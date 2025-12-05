import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/Toaster";
import AppStatusLoader from "@/core/AppStatusLoader";
import StateProvider from "@/core/StateProvider/StateProvider";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import { TooltipProvider } from "@/components";
import { createQueryClient } from "../core/queryClient";
import { emptyExplorer } from "@/connector/emptyExplorer";
import { ExplorerInjector } from "../core/ExplorerInjector";
import { Outlet } from "react-router";

const queryClient = createQueryClient({ explorer: emptyExplorer });

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
          <StateProvider>
            <AppStatusLoader>
              <Outlet />
              <Toaster />
            </AppStatusLoader>
          </StateProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
