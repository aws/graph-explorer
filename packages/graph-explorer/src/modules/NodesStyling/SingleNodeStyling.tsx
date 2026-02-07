import { type ComponentPropsWithRef, useEffect, useState } from "react";

import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import { useDisplayVertexTypeConfig, type VertexType } from "@/core";
import { useVertexStyling } from "@/core/StateProvider/userPreferences";
import { useDebounceValue, usePrevious } from "@/hooks";
import { LABELS } from "@/utils/constants";

import { useOpenNodeStyleDialog } from "./NodeStyleDialog";

export type SingleNodeStylingProps = {
  vertexType: VertexType;
} & ComponentPropsWithRef<typeof FormItem>;

export default function SingleNodeStyling({
  vertexType,
  ...rest
}: SingleNodeStylingProps) {
  const { setVertexStyle } = useVertexStyling(vertexType);
  const displayConfig = useDisplayVertexTypeConfig(vertexType);

  const [displayAs, setDisplayAs] = useState(displayConfig.displayLabel);

  const openNodeStyleDialog = useOpenNodeStyleDialog();

  // Delayed update of display name to prevent input lag
  const debouncedDisplayAs = useDebounceValue(displayAs, 400);
  const prevDisplayAs = usePrevious(debouncedDisplayAs);

  useEffect(() => {
    if (prevDisplayAs === null || prevDisplayAs === debouncedDisplayAs) {
      return;
    }
    void setVertexStyle({ displayLabel: debouncedDisplayAs });
  }, [debouncedDisplayAs, prevDisplayAs, setVertexStyle]);

  return (
    <FormItem {...rest}>
      {vertexType ? (
        <Label>{vertexType}</Label>
      ) : (
        <Label>{LABELS.MISSING_TYPE}</Label>
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
          variant="text"
          onClick={() => openNodeStyleDialog(vertexType)}
        >
          <StylingIcon />
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
