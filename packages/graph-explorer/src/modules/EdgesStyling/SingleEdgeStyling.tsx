import { type ComponentPropsWithRef, useEffect, useState } from "react";
import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import { useDisplayEdgeTypeConfig } from "@/core";
import { useEdgeStyling } from "@/core/StateProvider/userPreferences";
import { useDebounceValue, usePrevious } from "@/hooks";
import { LABELS } from "@/utils";
import { customizeEdgeTypeAtom } from "./EdgeStyleDialog";
import { useSetAtom } from "jotai";

export type SingleEdgeStylingProps = {
  edgeType: string;
} & ComponentPropsWithRef<typeof FormItem>;

export default function SingleEdgeStyling({
  edgeType,
  ...rest
}: SingleEdgeStylingProps) {
  const { setEdgeStyle } = useEdgeStyling(edgeType);
  const setCustomizeEdgeType = useSetAtom(customizeEdgeTypeAtom);
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
          onClick={() => setCustomizeEdgeType(edgeType)}
        >
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
