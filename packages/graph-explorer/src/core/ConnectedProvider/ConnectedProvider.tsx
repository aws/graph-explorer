import { type PropsWithChildren } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { NotificationProvider } from "@/components/NotificationProvider";
import Toast from "@/components/Toast";
import AppStatusLoader from "@/core/AppStatusLoader";
import StateProvider from "@/core/StateProvider/StateProvider";
import ThemeProvider from "@/core/ThemeProvider/ThemeProvider";
import { MantineProvider } from "@mantine/core";
import { emotionTransform, MantineEmotionProvider } from "@mantine/emotion";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import { TooltipProvider } from "@/components";
import { logger } from "@/utils";

function exponentialBackoff(attempt: number): number {
  return Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: exponentialBackoff,
      staleTime: 1000 * 60, // 1 minute cache
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError(error, query) {
      logger.error("Query failed to execute:", query.queryKey, error);
    },
  }),
});

export default function ConnectedProvider({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary FallbackComponent={AppErrorPage}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <MantineProvider stylesTransform={emotionTransform}>
            <MantineEmotionProvider>
              <ThemeProvider>
                <NotificationProvider component={Toast}>
                  <StateProvider>
                    <AppStatusLoader>{children}</AppStatusLoader>
                  </StateProvider>
                </NotificationProvider>
              </ThemeProvider>
            </MantineEmotionProvider>
          </MantineProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
