import { PropsWithChildren, Suspense } from "react";
import { RecoilRoot } from "recoil";
import StateDebug from "./StateDebug";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import AppLoadingPage from "@/core/AppLoadingPage";
import { NotInProduction } from "@/components";
import { showRecoilStateLoggingAtom } from "../featureFlags";

export default function StateProvider({
  children,
}: PropsWithChildren<Record<string, unknown>>) {
  return (
    <RecoilRoot>
      <ErrorBoundary FallbackComponent={AppErrorPage}>
        <Suspense fallback={<AppLoadingPage />}>
          {children}
          <NotInProduction featureFlag={showRecoilStateLoggingAtom}>
            <StateDebug />
          </NotInProduction>
        </Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
