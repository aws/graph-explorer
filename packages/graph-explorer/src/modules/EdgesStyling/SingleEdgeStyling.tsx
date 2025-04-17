import { useCallback, useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import {
  Button,
  ComponentBaseProps,
  FormItem,
  InputField,
  Label,
  StylingIcon,
} from "@/components";
import { useDisplayEdgeTypeConfig } from "@/core";
import {
  EdgePreferences,
  userStylingEdgeAtom,
} from "@/core/StateProvider/userPreferences";
import { useDebounceValue, usePrevious } from "@/hooks";
import { MISSING_DISPLAY_TYPE } from "@/utils";
import { customizeEdgeTypeAtom } from "./EdgeStyleDialog";

export type SingleEdgeStylingProps = {
  edgeType: string;
} & ComponentBaseProps;

export default function SingleEdgeStyling({
  edgeType,

  ...rest
}: SingleEdgeStylingProps) {
  const setEdgePreferences = useSetRecoilState(userStylingEdgeAtom(edgeType));
  const setCustomizeEdgeType = useSetRecoilState(customizeEdgeTypeAtom);
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);

  const [displayAs, setDisplayAs] = useState(displayConfig.displayLabel);

  const onUserPrefsChange = useCallback(
    (prefs: Omit<EdgePreferences, "type">) => {
      setEdgePreferences({ type: edgeType, ...prefs });
    },
    [edgeType, setEdgePreferences]
  );

  // Delayed update of display name to prevent input lag
  const debouncedDisplayAs = useDebounceValue(displayAs, 400);
  const prevDisplayAs = usePrevious(debouncedDisplayAs);

  useEffect(() => {
    if (prevDisplayAs === null || prevDisplayAs === debouncedDisplayAs) {
      return;
    }
    onUserPrefsChange({ displayLabel: debouncedDisplayAs });
  }, [debouncedDisplayAs, prevDisplayAs, onUserPrefsChange]);

  return (
    <FormItem {...rest}>
      {edgeType ? (
        <Label>{edgeType}</Label>
      ) : (
        <Label>{MISSING_DISPLAY_TYPE}</Label>
      )}
      <div className="flex flex-row items-center gap-2">
        <InputField
          className="grow"
          label="Display As"
          labelPlacement="inner"
          value={displayAs}
          onChange={setDisplayAs}
        />
        <Button
          icon={<StylingIcon />}
          variant="text"
          onClick={() => setCustomizeEdgeType(edgeType)}
        >
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
