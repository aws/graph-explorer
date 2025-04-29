import { useCallback, useMemo } from "react";
import { atom, useRecoilState, useResetRecoilState } from "recoil";
import {
  Button,
  Dialog,
  DialogBody,
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
  EdgePreferences,
  LineStyle,
  userStylingEdgeAtom,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import {
  SOURCE_ARROW_STYLE_OPTIONS,
  TARGET_ARROW_STYLE_OPTIONS,
} from "./arrowsStyling";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { RESERVED_TYPES_PROPERTY } from "@/utils";

export const customizeEdgeTypeAtom = atom<string | undefined>({
  key: "customize-edge-type",
  default: undefined,
});

export default function EdgeStyleDialog() {
  const [customizeEdgeType, setCustomizeEdgeType] = useRecoilState(
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
      <DialogContent>
        {customizeEdgeType ? <Content edgeType={customizeEdgeType} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Content({ edgeType }: { edgeType: string }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  const t = useTranslations();

  const [edgePreferences, setEdgePreferences] = useRecoilState(
    userStylingEdgeAtom(edgeType)
  );

  const selectOptions = useMemo(() => {
    const options = displayConfig.attributes.map(attr => ({
      value: attr.name,
      label: attr.displayLabel,
    }));

    options.unshift({
      label: t("edges-styling.edge-type"),
      value: RESERVED_TYPES_PROPERTY,
    });

    return options;
  }, [displayConfig.attributes, t]);

  const onUserPrefsChange = useCallback(
    (prefs: Omit<EdgePreferences, "type">) => {
      setEdgePreferences({ type: edgeType, ...prefs });
    },
    [edgeType, setEdgePreferences]
  );

  const onUserPrefsReset = useResetRecoilState(userStylingEdgeAtom(edgeType));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Customize Edge Style</DialogTitle>
        <DialogDescription>
          Customize styles for edge type {displayConfig.displayLabel}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-2">
          <div className="font-medium">Display Attributes</div>
          <div className="flex justify-between gap-2">
            <SelectField
              label="Display Name Attribute"
              labelPlacement="inner"
              value={displayConfig.displayNameAttribute}
              onValueChange={value =>
                onUserPrefsChange({
                  displayNameAttribute: value,
                })
              }
              options={selectOptions}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="font-medium">Label Styling</div>
          <div className="grid grid-cols-2 gap-2">
            <ColorInput
              label="Color"
              labelPlacement="inner"
              startColor={edgePreferences?.labelColor || "#17457b"}
              onChange={(color: string) =>
                onUserPrefsChange({ labelColor: color })
              }
              className="grow"
            />
            <InputField
              label="Background Opacity"
              labelPlacement="inner"
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={edgePreferences?.labelBackgroundOpacity ?? 0.7}
              onChange={(value: number) =>
                onUserPrefsChange({ labelBackgroundOpacity: value })
              }
              className="grow"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ColorInput
              label="Border Color"
              labelPlacement="inner"
              startColor={edgePreferences?.labelBorderColor || "#17457b"}
              onChange={(color: string) =>
                onUserPrefsChange({ labelBorderColor: color })
              }
            />
            <InputField
              label="Border Width"
              labelPlacement="inner"
              type="number"
              min={0}
              value={edgePreferences?.labelBorderWidth ?? 0}
              onChange={(value: number) =>
                onUserPrefsChange({ labelBorderWidth: value })
              }
            />
            <SelectField
              label="Border Style"
              labelPlacement="inner"
              value={edgePreferences?.labelBorderStyle || "solid"}
              onValueChange={value =>
                onUserPrefsChange({
                  labelBorderStyle: value as LineStyle,
                })
              }
              options={LINE_STYLE_OPTIONS}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="font-medium">Line Styling</div>
          <div className="grid grid-cols-3 gap-2">
            <ColorInput
              label="Color"
              labelPlacement="inner"
              startColor={edgePreferences?.lineColor || "#b3b3b3"}
              onChange={(color: string) =>
                onUserPrefsChange({ lineColor: color })
              }
            />
            <InputField
              label="Thickness"
              labelPlacement="inner"
              type="number"
              min={1}
              value={edgePreferences?.lineThickness || 2}
              onChange={(value: number) =>
                onUserPrefsChange({ lineThickness: value })
              }
            />
            <SelectField
              label="Style"
              labelPlacement="inner"
              value={edgePreferences?.lineStyle || "solid"}
              onValueChange={value =>
                onUserPrefsChange({ lineStyle: value as LineStyle })
              }
              options={LINE_STYLE_OPTIONS}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="font-medium">Arrows Styling</div>
          <div className="flex justify-between gap-2">
            <SelectField
              label="Source"
              labelPlacement="inner"
              value={edgePreferences?.sourceArrowStyle || "none"}
              onValueChange={value =>
                onUserPrefsChange({
                  sourceArrowStyle: value as ArrowStyle,
                })
              }
              options={SOURCE_ARROW_STYLE_OPTIONS}
            />
            <SelectField
              label="Target"
              labelPlacement="inner"
              value={edgePreferences?.targetArrowStyle || "triangle"}
              onValueChange={value =>
                onUserPrefsChange({
                  targetArrowStyle: value as ArrowStyle,
                })
              }
              options={TARGET_ARROW_STYLE_OPTIONS}
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onPress={onUserPrefsReset}>Reset to Default</Button>
      </DialogFooter>
    </>
  );
}
