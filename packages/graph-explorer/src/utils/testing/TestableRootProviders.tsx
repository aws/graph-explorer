import React from "react";
import { RecoilRoot } from "recoil";
import ConfigurationProvider from "../../core/ConfigurationProvider";

export function TestableRootProviders({
  children,
}: React.PropsWithChildren<never>) {
  return (
    <RecoilRoot>
      <ConfigurationProvider>{children}</ConfigurationProvider>
    </RecoilRoot>
  );
}
