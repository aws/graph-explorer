import { ComponentPropsWithRef, useCallback, useEffect, useState } from "react";
import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import { useDisplayVertexTypeConfig } from "@/core";
import {
  userStylingNodeAtom,
  VertexPreferences,
} from "@/core/StateProvider/userPreferences";
import { useDebounceValue, usePrevious } from "@/hooks";
import { MISSING_DISPLAY_TYPE } from "@/utils/constants";
import { customizeNodeTypeAtom } from "./NodeStyleDialog";
import { useSetAtom } from "jotai";

export type SingleNodeStylingProps = {
  vertexType: string;
} & ComponentPropsWithRef<typeof FormItem>;

export default function SingleNodeStyling({
  vertexType,

  ...rest
}: SingleNodeStylingProps) {
  const setNodePreferences = useSetAtom(userStylingNodeAtom(vertexType));
  const displayConfig = useDisplayVertexTypeConfig(vertexType);

  const [displayAs, setDisplayAs] = useState(displayConfig.displayLabel);

  const setCustomizeNodeType = useSetAtom(customizeNodeTypeAtom);

  const onUserPrefsChange = useCallback(
    (prefs: Omit<VertexPreferences, "type">) => {
      setNodePreferences({ type: vertexType, ...prefs });
    },
    [setNodePreferences, vertexType]
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
      {vertexType ? (
        <Label>{vertexType}</Label>
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
          onClick={() => setCustomizeNodeType(vertexType)}
        >
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
