import { PropsWithChildren, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import AppErrorPage from "@/core/AppErrorPage";
import AppLoadingPage from "@/core/AppLoadingPage";
import { useAtomValue } from "jotai";
import { showDebugActionsAtom, allowLoggingDbQueryAtom } from "../featureFlags";
import { activeConfigurationAtom, configurationAtom } from "./configuration";
import { allGraphSessionsAtom } from "./graphSession";
import { schemaAtom } from "./schema";
import { userStylingAtom, userLayoutAtom } from "./userPreferences";

export default function StateProvider({
  children,
}: PropsWithChildren<Record<string, unknown>>) {
  return (
    <ErrorBoundary FallbackComponent={AppErrorPage}>
      <Suspense fallback={<AppLoadingPage />}>
        <PreloadLocalForageData>{children}</PreloadLocalForageData>
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Preloads LocalForage data in to Jotai state.
 *
 * If we don't do this, the UI may show stale data while the data loads asynchronously.
 */
function PreloadLocalForageData(props: PropsWithChildren) {
  useAtomValue(allGraphSessionsAtom);

  useAtomValue(userStylingAtom);
  useAtomValue(userLayoutAtom);

  useAtomValue(activeConfigurationAtom);
  useAtomValue(configurationAtom);
  useAtomValue(schemaAtom);
  useAtomValue(showDebugActionsAtom);
  useAtomValue(allowLoggingDbQueryAtom);

  return props.children;
}
