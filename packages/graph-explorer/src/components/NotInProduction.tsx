import { PropsWithChildren } from "react";
import { env } from "../utils";
import { atom, RecoilValue, useRecoilValue } from "recoil";

type Props = {
  /** Optionally check an additional feature flag from Recoil state. */
  featureFlag?: RecoilValue<boolean>;
};

/** Always enabled feature flag. */
const defaultFeatureFlagAtom = atom({
  key: "feature-flag-always-enabled",
  default: true,
});

/** Returns null if `MODE == PRODUCTION` or the feature flag is false. */
export default function NotInProduction(props: PropsWithChildren<Props>) {
  const featureFlag = useRecoilValue(
    props.featureFlag ?? defaultFeatureFlagAtom
  );

  if (env.PROD || !featureFlag) {
    return null;
  }

  return props.children;
}
