import { PropsWithChildren } from "react";
import { RecoilRoot } from "recoil";
import StateDebug from "./StateDebug";
import { env } from "../../utils";

const StateProvider = ({
  children,
}: PropsWithChildren<Record<string, unknown>>) => {
  return (
    <RecoilRoot>
      {children}
      {/* {env.DEV && <StateDebug />} */}
    </RecoilRoot>
  );
};

export default StateProvider;
