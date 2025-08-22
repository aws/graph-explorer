import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
  DialogFooter,
} from "@/components/Dialog";
import { Button, InputField, SelectField } from "@/components";
import ColorInput from "@/components/ColorInput/ColorInput";
import { useDisplayEdgeTypeConfig } from "@/core";
import {
  ArrowStyle,
  LineStyle,
  useEdgeStyling,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import {
  SOURCE_ARROW_STYLE_OPTIONS,
  TARGET_ARROW_STYLE_OPTIONS,
} from "./arrowsStyling";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { RESERVED_TYPES_PROPERTY } from "@/utils";
import { atom, useAtom } from "jotai";

export const customizeEdgeTypeAtom = atom<string | undefined>(undefined);

export default function EdgeStyleDialog() {
  const [customizeEdgeType, setCustomizeEdgeType] = useAtom(
    customizeEdgeTypeAtom
  );

  return (
    <Dialog
      open={Boolean(customizeEdgeType)}
      onOpenChange={open => !open && setCustomizeEdgeType(undefined)}
    >
      {customizeEdgeType ? (
        <DialogContent>
          <EdgeDialogTitle edgeType={customizeEdgeType} />
          <DialogBody>
            <Content edgeType={customizeEdgeType} />
          </DialogBody>
          <DialogFooter>
            <ResetStylesButton edgeType={customizeEdgeType} />
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function EdgeDialogTitle({ edgeType }: { edgeType: string }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  const t = useTranslations();

  return (
    <DialogHeader>
      <DialogTitle>{t("edges-styling.title")}</DialogTitle>
      <DialogDescription>
        Customize styling for {displayConfig.displayLabel}
      </DialogDescription>
    </DialogHeader>
  );
}

function Content({ edgeType }: { edgeType: string }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  const t = useTranslations();

  const { edgeStyle, setEdgeStyle } = useEdgeStyling(edgeType);

  const selectOptions = (() => {
    const options = displayConfig.attributes.map(attr => ({
      value: attr.name,
      label: attr.displayLabel,
    }));

    options.unshift({
      label: t("edges-styling.edge-type"),
      value: RESERVED_TYPES_PROPERTY,
    });

    return options;
  })();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-base font-medium">Display Attributes</p>
        <div className="grid grid-cols-1 gap-2">
          <SelectField
            label="Display Name Attribute"
            labelPlacement="inner"
            value={displayConfig.displayNameAttribute}
            onValueChange={value =>
              setEdgeStyle({ displayNameAttribute: value })
            }
            options={selectOptions}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium">Label Styling</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            color={edgeStyle?.labelColor || "#17457b"}
            onChange={(color: string) => setEdgeStyle({ labelColor: color })}
          />
          <InputField
            label="Background Opacity"
            labelPlacement="inner"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={edgeStyle?.labelBackgroundOpacity ?? 0.7}
            onChange={(value: number) =>
              setEdgeStyle({ labelBackgroundOpacity: value })
            }
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ColorInput
            label="Border Color"
            labelPlacement="inner"
            color={edgeStyle?.labelBorderColor || "#17457b"}
            onChange={(color: string) =>
              setEdgeStyle({ labelBorderColor: color })
            }
          />
          <InputField
            label="Border Width"
            labelPlacement="inner"
            type="number"
            min={0}
            value={edgeStyle?.labelBorderWidth ?? 0}
            onChange={(value: number) =>
              setEdgeStyle({ labelBorderWidth: value })
            }
          />
          <SelectField
            label="Border Style"
            labelPlacement="inner"
            value={edgeStyle?.labelBorderStyle || "solid"}
            onValueChange={value =>
              setEdgeStyle({ labelBorderStyle: value as LineStyle })
            }
            options={LINE_STYLE_OPTIONS}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium">Line Styling</p>
        <div className="grid grid-cols-3 gap-2">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            color={edgeStyle?.lineColor || "#b3b3b3"}
            onChange={(color: string) => setEdgeStyle({ lineColor: color })}
          />
          <InputField
            label="Thickness"
            labelPlacement="inner"
            type="number"
            min={1}
            value={edgeStyle?.lineThickness || 2}
            onChange={(value: number) => setEdgeStyle({ lineThickness: value })}
          />
          <SelectField
            label="Style"
            labelPlacement="inner"
            value={edgeStyle?.lineStyle || "solid"}
            onValueChange={value =>
              setEdgeStyle({ lineStyle: value as LineStyle })
            }
            options={LINE_STYLE_OPTIONS}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium">Arrows Styling</p>
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Source"
            labelPlacement="inner"
            value={edgeStyle?.sourceArrowStyle || "none"}
            onValueChange={value =>
              setEdgeStyle({ sourceArrowStyle: value as ArrowStyle })
            }
            options={SOURCE_ARROW_STYLE_OPTIONS}
          />
          <SelectField
            label="Target"
            labelPlacement="inner"
            value={edgeStyle?.targetArrowStyle || "triangle"}
            onValueChange={value =>
              setEdgeStyle({ targetArrowStyle: value as ArrowStyle })
            }
            options={TARGET_ARROW_STYLE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

function ResetStylesButton({ edgeType }: { edgeType: string }) {
  const { resetEdgeStyle } = useEdgeStyling(edgeType);

  return <Button onClick={resetEdgeStyle}>Reset to Default</Button>;
}
