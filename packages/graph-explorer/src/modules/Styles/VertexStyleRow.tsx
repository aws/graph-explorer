import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type ComponentPropsWithRef, useEffect, useState } from "react";

import { Button, FormItem, InputField, Label, StylingIcon } from "@/components";
import {
  useDisplayVertexTypeConfig,
  useHiddenSchemaTypes,
  type VertexType,
} from "@/core";
import { useVertexStyling } from "@/core/StateProvider/graphStyles";
import { useDebounceValue, usePrevious } from "@/hooks";
import { useOpenNodeStyleDialog } from "@/modules/NodesStyling";
import { cn } from "@/utils";
import { LABELS } from "@/utils/constants";

export type VertexStyleRowProps = {
  vertexType: VertexType;
  /** Shows an eye toggle to hide this vertex type from the Schema view. */
  showVisibilityToggle?: boolean;
} & ComponentPropsWithRef<typeof FormItem>;

export function VertexStyleRow({
  vertexType,
  showVisibilityToggle,
  className,
  ...rest
}: VertexStyleRowProps) {
  const { setVertexStyle } = useVertexStyling(vertexType);
  const displayConfig = useDisplayVertexTypeConfig(vertexType);
  const { isHidden, toggleType } = useHiddenSchemaTypes();

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

  const hidden = showVisibilityToggle && isHidden(vertexType);

  return (
    <FormItem className={cn(hidden && "opacity-50", className)} {...rest}>
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
        {showVisibilityToggle ? (
          <Button
            variant="ghost"
            size="icon-small"
            tooltip={
              hidden
                ? `Show ${vertexType} in schema view`
                : `Hide ${vertexType} from schema view`
            }
            onClick={() => toggleType(vertexType)}
          >
            {hidden ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        ) : null}
      </div>
    </FormItem>
  );
}
