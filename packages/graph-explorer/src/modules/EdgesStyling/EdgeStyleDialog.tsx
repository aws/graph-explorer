import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputField,
  SelectField,
} from "@/components";
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
      onOpenChange={opened => {
        if (!opened) {
          setCustomizeEdgeType(undefined);
        }
      }}
    >
      <DialogContent className="w-[500px]">
        {customizeEdgeType ? <Content edgeType={customizeEdgeType} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Content({ edgeType }: { edgeType: string }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  const t = useTranslations();

  const { edgeStyle, setEdgeStyle, resetEdgeStyle } = useEdgeStyling(edgeType);

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
    <>
      <DialogHeader>
        <DialogTitle>Customize Edge Style</DialogTitle>
        <DialogDescription>
          Customize styles for edge type {displayConfig.displayLabel}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-4">
          <div className="font-medium leading-none">Display Attributes</div>
          <div className="flex justify-between gap-4">
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
        <div className="space-y-4">
          <div className="font-medium leading-none">Label Styling</div>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              label="Color"
              labelPlacement="inner"
              color={edgeStyle?.labelColor || "#17457b"}
              onChange={(color: string) => setEdgeStyle({ labelColor: color })}
              className="grow"
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
              className="grow"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
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
                setEdgeStyle({
                  labelBorderStyle: value as LineStyle,
                })
              }
              options={LINE_STYLE_OPTIONS}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="font-medium leading-none">Line Styling</div>
          <div className="grid grid-cols-3 gap-4">
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
              onChange={(value: number) =>
                setEdgeStyle({ lineThickness: value })
              }
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
        <div className="space-y-4">
          <div className="font-medium leading-none">Arrows Styling</div>
          <div className="flex justify-between gap-4">
            <SelectField
              label="Source"
              labelPlacement="inner"
              value={edgeStyle?.sourceArrowStyle || "none"}
              onValueChange={value =>
                setEdgeStyle({
                  sourceArrowStyle: value as ArrowStyle,
                })
              }
              options={SOURCE_ARROW_STYLE_OPTIONS}
            />
            <SelectField
              label="Target"
              labelPlacement="inner"
              value={edgeStyle?.targetArrowStyle || "triangle"}
              onValueChange={value =>
                setEdgeStyle({
                  targetArrowStyle: value as ArrowStyle,
                })
              }
              options={TARGET_ARROW_STYLE_OPTIONS}
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        <Button onPress={resetEdgeStyle}>Reset to Default</Button>
        <DialogClose asChild>
          <Button variant="filled">Done</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
