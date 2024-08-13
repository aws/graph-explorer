import { PropsWithChildren, Suspense } from "react";
import { RecoilRoot } from "recoil";
import StateDebug from "./StateDebug";
import { env } from "../../utils";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "../AppErrorPage";
import AppLoadingPage from "../AppLoadingPage";

export default function StateProvider({
  children,
}: PropsWithChildren<Record<string, unknown>>) {
  return (
    <RecoilRoot>
      <ErrorBoundary FallbackComponent={AppErrorPage}>
        <Suspense fallback={<AppLoadingPage />}>
          {children}
          {env.DEV && <StateDebug />}
        </Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
