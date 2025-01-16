import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { RecoilRootProps, RecoilRoot, MutableSnapshot } from "recoil";

export default function renderHookWithRecoilRoot<TResult>(
  callback: (props: RecoilRootProps) => TResult,
  initializeState?: (mutableSnapshot: MutableSnapshot) => void
) {
  return renderHook(callback, {
    wrapper: ({ children }) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <RecoilRoot initializeState={initializeState}>{children}</RecoilRoot>
        </QueryClientProvider>
      );
    },
  });
}
