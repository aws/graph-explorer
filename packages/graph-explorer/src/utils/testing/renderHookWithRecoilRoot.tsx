import { renderHook } from "@testing-library/react-hooks";
import { RecoilRootProps, RecoilRoot, MutableSnapshot } from "recoil";
import ConfigurationProvider from "../../core/ConfigurationProvider";

export default function renderHookWithRecoilRoot<TResult>(
  callback: (props: RecoilRootProps) => TResult,
  initializeState?: (mutableSnapshot: MutableSnapshot) => void
) {
  return renderHook<RecoilRootProps, TResult>(callback, {
    wrapper: ({ children }) => (
      <RecoilRoot initializeState={initializeState}>
        <ConfigurationProvider>{children}</ConfigurationProvider>
      </RecoilRoot>
    ),
  });
}
