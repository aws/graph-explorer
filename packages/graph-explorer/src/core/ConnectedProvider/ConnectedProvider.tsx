import { type PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "@/components/NotificationProvider";
import Toast from "@/components/Toast";
import AppStatusLoader from "@/core/AppStatusLoader";
import StateProvider from "@/core/StateProvider/StateProvider";
import { ThemeProvider } from "@/core/ThemeProvider";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import { TooltipProvider } from "@/components";
import { createQueryClient } from "../queryClient";
import { emptyExplorer } from "@/connector/emptyExplorer";
import { ExplorerInjector } from "../ExplorerInjector";

const queryClient = createQueryClient({ explorer: emptyExplorer });

export default function ConnectedProvider({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary FallbackComponent={AppErrorPage}>
      <QueryClientProvider client={queryClient}>
        <ExplorerInjector />
        <TooltipProvider delayDuration={200}>
          <ThemeProvider>
            <NotificationProvider component={Toast}>
              <StateProvider>
                <AppStatusLoader>{children}</AppStatusLoader>
              </StateProvider>
            </NotificationProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
