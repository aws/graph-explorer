import { type ComponentPropsWithRef, useEffect, useState } from "react";

import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import { useDisplayVertexTypeConfig, type VertexType } from "@/core";
import { useVertexStyling } from "@/core/StateProvider/graphStyles";
import { useDebounceValue, usePrevious } from "@/hooks";
import { useOpenNodeStyleDialog } from "@/modules/NodesStyling";
import { LABELS } from "@/utils/constants";

export type VertexStyleRowProps = {
  vertexType: VertexType;
} & ComponentPropsWithRef<typeof FormItem>;

export function VertexStyleRow({ vertexType, ...rest }: VertexStyleRowProps) {
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
    setVertexStyle({ displayLabel: debouncedDisplayAs });
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
        <Button variant="ghost" onClick={() => openNodeStyleDialog(vertexType)}>
          <StylingIcon />
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
