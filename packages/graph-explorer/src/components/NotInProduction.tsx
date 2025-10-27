import type { PropsWithChildren } from "react";
import { env } from "@/utils";
import { type Atom, atom, useAtomValue } from "jotai";

type Props = {
  /** Optionally check an additional feature flag from Jotai state. */
  featureFlag?: Atom<boolean>;
};

/** Always enabled feature flag. */
const defaultFeatureFlagAtom = atom(true);

/** Returns null if `MODE == PRODUCTION` or the feature flag is false. */
export default function NotInProduction(props: PropsWithChildren<Props>) {
  const featureFlag = useAtomValue(props.featureFlag ?? defaultFeatureFlagAtom);

  if (env.PROD || !featureFlag) {
    return null;
  }

  return props.children;
}
