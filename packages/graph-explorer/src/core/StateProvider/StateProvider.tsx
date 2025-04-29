import { PropsWithChildren, Suspense } from "react";
import { RecoilRoot } from "recoil";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import AppLoadingPage from "@/core/AppLoadingPage";

export default function StateProvider({
  children,
}: PropsWithChildren<Record<string, unknown>>) {
  return (
    <RecoilRoot>
      <ErrorBoundary FallbackComponent={AppErrorPage}>
        <Suspense fallback={<AppLoadingPage />}>{children}</Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
