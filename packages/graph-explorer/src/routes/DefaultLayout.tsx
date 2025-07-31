import { QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "@/components/NotificationProvider";
import Toast from "@/components/Toast";
import AppStatusLoader from "@/core/AppStatusLoader";
import StateProvider from "@/core/StateProvider/StateProvider";
import { ThemeProvider } from "@/core/ThemeProvider";
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
          <ThemeProvider>
            <NotificationProvider component={Toast}>
              <StateProvider>
                <AppStatusLoader>
                  <Outlet />
                </AppStatusLoader>
              </StateProvider>
            </NotificationProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
