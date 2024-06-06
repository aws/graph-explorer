import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { RecoilRootProps, RecoilRoot, MutableSnapshot } from "recoil";

export default function renderHookWithRecoilRoot<TResult>(
  callback: (props: RecoilRootProps) => TResult,
  initializeState?: (mutableSnapshot: MutableSnapshot) => void
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <RecoilRoot initializeState={initializeState}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </RecoilRoot>
    ),
  });
}
