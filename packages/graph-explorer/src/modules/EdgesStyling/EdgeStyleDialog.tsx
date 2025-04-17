import { Modal } from "@mantine/core";
import { useCallback, useMemo } from "react";
import { atom, useRecoilState, useResetRecoilState } from "recoil";
import { Button, InputField, SelectField } from "@/components";
import ColorInput from "@/components/ColorInput/ColorInput";
import { useDisplayEdgeTypeConfig, useWithTheme } from "@/core";
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
import modalDefaultStyles from "./SingleEdgeStylingModal.style";
import { RESERVED_TYPES_PROPERTY } from "@/utils";

export const customizeEdgeTypeAtom = atom<string | undefined>({
  key: "customize-edge-type",
  default: undefined,
});

export default function EdgeStyleDialog() {
  const styleWithTheme = useWithTheme();

  const [customizeEdgeType, setCustomizeEdgeType] = useRecoilState(
    customizeEdgeTypeAtom
  );

  return (
    <Modal
      opened={Boolean(customizeEdgeType)}
      onClose={() => setCustomizeEdgeType(undefined)}
      centered={true}
      size="auto"
      title={
        customizeEdgeType ? <DialogTitle edgeType={customizeEdgeType} /> : null
      }
      className={styleWithTheme(modalDefaultStyles)}
      overlayProps={{
        backgroundOpacity: 0.1,
      }}
    >
      {customizeEdgeType ? <Content edgeType={customizeEdgeType} /> : null}
    </Modal>
  );
}

function DialogTitle({ edgeType }: { edgeType: string }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  return (
    <div>
      Customize <strong>{displayConfig.displayLabel}</strong>
    </div>
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
    <div className="modal-container">
      <div>
        <p>Display Attributes</p>
        <div className="attrs-container">
          <SelectField
            label="Display Name Attribute"
            labelPlacement="inner"
            value={displayConfig.displayNameAttribute}
            onValueChange={value =>
              onUserPrefsChange({ displayNameAttribute: value })
            }
            options={selectOptions}
          />
        </div>
      </div>
      <div>
        <p>Label Styling</p>
        <div className="attrs-container">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            startColor={edgePreferences?.labelColor || "#17457b"}
            onChange={(color: string) =>
              onUserPrefsChange({ labelColor: color })
            }
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
          />
        </div>
      </div>
      <div>
        <div className="attrs-container">
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
              onUserPrefsChange({ labelBorderStyle: value as LineStyle })
            }
            options={LINE_STYLE_OPTIONS}
          />
        </div>
      </div>
      <div>
        <p>Line Styling</p>
        <div className="attrs-container">
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
      <div>
        <p>Arrows Styling</p>
        <div className="attrs-container">
          <SelectField
            label="Source"
            labelPlacement="inner"
            value={edgePreferences?.sourceArrowStyle || "none"}
            onValueChange={value =>
              onUserPrefsChange({ sourceArrowStyle: value as ArrowStyle })
            }
            options={SOURCE_ARROW_STYLE_OPTIONS}
          />
          <SelectField
            label="Target"
            labelPlacement="inner"
            value={edgePreferences?.targetArrowStyle || "triangle"}
            onValueChange={value =>
              onUserPrefsChange({ targetArrowStyle: value as ArrowStyle })
            }
            options={TARGET_ARROW_STYLE_OPTIONS}
          />
        </div>
      </div>
      <div className="actions">
        <Button onPress={onUserPrefsReset}>Reset to Default</Button>
      </div>
    </div>
  );
}
