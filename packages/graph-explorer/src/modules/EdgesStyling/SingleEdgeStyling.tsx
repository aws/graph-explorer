import { type ComponentPropsWithRef, useEffect, useState } from "react";

import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import { type EdgeType, useDisplayEdgeTypeConfig } from "@/core";
import { useEdgeStyling } from "@/core/StateProvider/userPreferences";
import { useDebounceValue, usePrevious } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import { LABELS, logAndNotify } from "@/utils";

import { useOpenEdgeStyleDialog } from "./EdgeStyleDialog";

export type SingleEdgeStylingProps = {
  edgeType: EdgeType;
} & ComponentPropsWithRef<typeof FormItem>;

export default function SingleEdgeStyling({
  edgeType,
  ...rest
}: SingleEdgeStylingProps) {
  const t = useTranslations();
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
    setEdgeStyle({ displayLabel: debouncedDisplayAs }).catch(
      logAndNotify(`Failed to save the ${t("edge").toLowerCase()} style.`, {
        description: "Your style change may be lost when you reload.",
      }),
    );
  }, [debouncedDisplayAs, prevDisplayAs, setEdgeStyle, t]);

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
        <Button variant="ghost" onClick={() => openEdgeStyleDialog(edgeType)}>
          <StylingIcon />
          Customize
        </Button>
      </div>
    </FormItem>
  );
}
