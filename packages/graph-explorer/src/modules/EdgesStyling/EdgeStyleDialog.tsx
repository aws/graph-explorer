import { Modal } from "@mantine/core";
import { Button, InputField, SelectField } from "@/components";
import ColorInput from "@/components/ColorInput/ColorInput";
import { useDisplayEdgeTypeConfig, useWithTheme } from "@/core";
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
import modalDefaultStyles from "./SingleEdgeStylingModal.style";
import { RESERVED_TYPES_PROPERTY } from "@/utils";
import { atom, useAtom } from "jotai";

export const customizeEdgeTypeAtom = atom<string | undefined>(undefined);

export default function EdgeStyleDialog() {
  const styleWithTheme = useWithTheme();

  const [customizeEdgeType, setCustomizeEdgeType] = useAtom(
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
    <div className="modal-container">
      <div>
        <p>Display Attributes</p>
        <div className="attrs-container">
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
      <div>
        <p>Label Styling</p>
        <div className="attrs-container">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            startColor={edgeStyle?.labelColor || "#17457b"}
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
      </div>
      <div>
        <div className="attrs-container">
          <ColorInput
            label="Border Color"
            labelPlacement="inner"
            startColor={edgeStyle?.labelBorderColor || "#17457b"}
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
      <div>
        <p>Line Styling</p>
        <div className="attrs-container">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            startColor={edgeStyle?.lineColor || "#b3b3b3"}
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
      <div>
        <p>Arrows Styling</p>
        <div className="attrs-container">
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
      <div className="actions">
        <Button onPress={resetEdgeStyle}>Reset to Default</Button>
      </div>
    </div>
  );
}
