import { type PropsWithChildren } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NotificationProvider } from "@/components/NotificationProvider";
import Toast from "@/components/Toast";
import AppStatusLoader from "@/core/AppStatusLoader";
import type { RawConfiguration } from "@/core/ConfigurationProvider";
import StateProvider from "@/core/StateProvider/StateProvider";
import ThemeProvider from "@/core/ThemeProvider/ThemeProvider";
import { MantineProvider } from "@mantine/core";
import { emotionTransform, MantineEmotionProvider } from "@mantine/emotion";
import { ExpandNodeProvider } from "@/hooks/useExpandNode";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";

export type ConnectedProviderProps = {
  config?: RawConfiguration;
};

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

const ConnectedProvider = (
  props: PropsWithChildren<ConnectedProviderProps>
) => {
  const { config, children } = props;
  return (
    <ErrorBoundary FallbackComponent={AppErrorPage}>
      <div className="h-screen w-full overflow-hidden">
        <QueryClientProvider client={queryClient}>
          <DndProvider backend={HTML5Backend}>
            <MantineProvider stylesTransform={emotionTransform}>
              <MantineEmotionProvider>
                <ThemeProvider>
                  <NotificationProvider component={Toast}>
                    <StateProvider>
                      <AppStatusLoader config={config}>
                        <ExpandNodeProvider>{children}</ExpandNodeProvider>
                      </AppStatusLoader>
                    </StateProvider>
                  </NotificationProvider>
                </ThemeProvider>
              </MantineEmotionProvider>
            </MantineProvider>
          </DndProvider>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        </QueryClientProvider>
      </div>
    </ErrorBoundary>
  );
};

export default ConnectedProvider;
