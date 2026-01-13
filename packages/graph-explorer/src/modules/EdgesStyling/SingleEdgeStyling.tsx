import { type ComponentPropsWithRef, useEffect, useState } from "react";

import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import { type EdgeType, useDisplayEdgeTypeConfig } from "@/core";
import { useEdgeStyling } from "@/core/StateProvider/userPreferences";
import { useDebounceValue, usePrevious } from "@/hooks";
import { LABELS } from "@/utils";

import { useOpenEdgeStyleDialog } from "./EdgeStyleDialog";

export type SingleEdgeStylingProps = {
  edgeType: EdgeType;
} & ComponentPropsWithRef<typeof FormItem>;

export default function SingleEdgeStyling({
  edgeType,
  ...rest
}: SingleEdgeStylingProps) {
  const { setEdgeStyle } = useEdgeStyling(edgeType);
  const openEdgeStyleDialog = useOpenEdgeStyleDialog();
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);

  const [displayAs, setDisplayAs] = useState(displayConfig.displayLabel);

  // Delayed update of display name to prevent input lag
  const debouncedDisplayAs = useDebounceValue(displayAs, 400);
  const prevDisplayAs = usePrevious(debouncedDisplayAs);

  useEffect(() => {
    if (prevDisplayAs === null || prevDisplayAs === debouncedDisplayAs) {
      return;
    }
    void setEdgeStyle({ displayLabel: debouncedDisplayAs });
  }, [debouncedDisplayAs, prevDisplayAs, setEdgeStyle]);

  return (
    <FormItem {...rest}>
      {edgeType ? (
        <Label>{edgeType}</Label>
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
          icon={<StylingIcon />}
          variant="text"
          onClick={() => openEdgeStyleDialog(edgeType)}
        >
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
