import type { PropsWithChildren } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "../../components/NotificationProvider";
import Toast from "../../components/Toast";
import AppStatusLoader from "../AppStatusLoader";
import type { RawConfiguration } from "../ConfigurationProvider";
import StateProvider from "../StateProvider/StateProvider";
import type { ThemeProviderProps } from "../ThemeProvider/ThemeProvider";
import ThemeProvider from "../ThemeProvider/ThemeProvider";
import { MantineProvider } from "@mantine/core";
import { emotionTransform, MantineEmotionProvider } from "@mantine/emotion";
import { ExpandNodeProvider } from "../../hooks/useExpandNode";

export type ConnectedProviderProps = {
  config?: RawConfiguration;
} & ThemeProviderProps;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
});

const ConnectedProvider = (
  props: PropsWithChildren<ConnectedProviderProps>
) => {
  const { config, children, ...themeProps } = props;
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <MantineProvider stylesTransform={emotionTransform}>
            <MantineEmotionProvider>
              <ThemeProvider {...themeProps}>
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
      </QueryClientProvider>
    </div>
  );
};

export default ConnectedProvider;
