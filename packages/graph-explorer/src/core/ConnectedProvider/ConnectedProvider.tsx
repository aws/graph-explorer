import { type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "@/components/NotificationProvider";
import Toast from "@/components/Toast";
import AppStatusLoader from "@/core/AppStatusLoader";
import StateProvider from "@/core/StateProvider/StateProvider";
import ThemeProvider from "@/core/ThemeProvider/ThemeProvider";
import { MantineProvider } from "@mantine/core";
import { emotionTransform, MantineEmotionProvider } from "@mantine/emotion";
import { ExpandNodeProvider } from "@/hooks/useExpandNode";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import { TooltipProvider } from "@/components";

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
                    <AppStatusLoader>
                      <ExpandNodeProvider>{children}</ExpandNodeProvider>
                    </AppStatusLoader>
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
