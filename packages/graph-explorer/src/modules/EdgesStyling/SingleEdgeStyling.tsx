import { Modal } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilState, useResetRecoilState } from "recoil";
import { Button, Input, Select, StylingIcon } from "../../components";
import ColorInput from "../../components/ColorInput/ColorInput";
import { useWithTheme } from "../../core";
import {
  ArrowStyle,
  EdgePreferences,
  LineStyle,
  userStylingEdgeAtom,
} from "../../core/StateProvider/userPreferences";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
import {
  SOURCE_ARROW_STYLE_OPTIONS,
  TARGET_ARROW_STYLE_OPTIONS,
} from "./arrowsStyling";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import defaultStyles from "./SingleEdgeStyling.style";
import modalDefaultStyles from "./SingleEdgeStylingModal.style";
import { useEdgeTypeConfig } from "../../core/ConfigurationProvider/useConfiguration";
import { useDebounceValue, usePrevious } from "../../hooks";

export type SingleEdgeStylingProps = {
  edgeType: string;
  opened: boolean;
  onOpen(): void;
  onClose(): void;
};

export default function SingleEdgeStyling({
  edgeType,
  opened,
  onOpen,
  onClose,
}: SingleEdgeStylingProps) {
  const t = useTranslations();
  const styleWithTheme = useWithTheme();

  const [edgePreferences, setEdgePreferences] = useRecoilState(
    userStylingEdgeAtom(edgeType)
  );
  const textTransform = useTextTransform();
  const etConfig = useEdgeTypeConfig(edgeType);

  const [displayAs, setDisplayAs] = useState(
    etConfig.displayLabel || textTransform(edgeType)
  );

  const selectOptions = useMemo(() => {
    const options =
      etConfig?.attributes.map(attr => ({
        value: attr.name,
        label: attr.displayLabel || textTransform(attr.name),
      })) || [];

    options.unshift({
      label: t("edges-styling.edge-type"),
      value: "type",
    });

    return options;
  }, [t, textTransform, etConfig?.attributes]);

  const onUserPrefsChange = useCallback(
    (prefs: Omit<EdgePreferences, "type">) => {
      setEdgePreferences({ type: edgeType, ...prefs });
    },
    [edgeType, setEdgePreferences]
  );

  const onUserPrefsReset = useResetRecoilState(userStylingEdgeAtom(edgeType));

  // Delayed update of display name to prevent input lag
  const debouncedDisplayAs = useDebounceValue(displayAs, 400);
  const prevDisplayAs = usePrevious(debouncedDisplayAs);

  useEffect(() => {
    if (prevDisplayAs === null || prevDisplayAs === debouncedDisplayAs) {
      return;
    }
    onUserPrefsChange({ displayLabel: debouncedDisplayAs });
  }, [debouncedDisplayAs, prevDisplayAs, onUserPrefsChange]);

  return (
    <div className={styleWithTheme(defaultStyles)}>
      <div className={"title"}>
        <div className={"edge-name"}>{edgeType}</div>
      </div>
      <div className={"label-container"}>
        <Input
          className={"label-display"}
          label={"Display As"}
          labelPlacement={"inner"}
          value={displayAs}
          onChange={setDisplayAs}
          hideError={true}
          noMargin={true}
        />
        <Button
          icon={<StylingIcon />}
          variant={"text"}
          size={"small"}
          onPress={onOpen}
        >
          Customize
        </Button>
      </div>
      <Modal
        opened={opened}
        onClose={onClose}
        centered={true}
        title={
          <div>
            Customize <strong>{displayAs || edgeType}</strong>
          </div>
        }
        className={styleWithTheme(modalDefaultStyles)}
        overlayProps={{
          backgroundOpacity: 0.1,
        }}
      >
        <div className={"container"}>
          <div>
            <p>Display Attributes</p>
            <div className={"attrs-container"}>
              <Select
                label={"Display Name Attribute"}
                labelPlacement={"inner"}
                value={etConfig?.displayNameAttribute || "type"}
                onChange={value =>
                  onUserPrefsChange({ displayNameAttribute: value as string })
                }
                options={selectOptions}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <p>Label Styling</p>
            <div className={"attrs-container"}>
              <ColorInput
                label={"Color"}
                labelPlacement={"inner"}
                startColor={edgePreferences?.labelColor || "#17457b"}
                onChange={(color: string) =>
                  onUserPrefsChange({ labelColor: color })
                }
              />
              <Input
                label={"Background Opacity"}
                labelPlacement={"inner"}
                type={"number"}
                min={0}
                max={1}
                step={0.1}
                value={edgePreferences?.labelBackgroundOpacity ?? 0.7}
                onChange={(value: number) =>
                  onUserPrefsChange({ labelBackgroundOpacity: value })
                }
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <div className={"attrs-container"}>
              <ColorInput
                label={"Border Color"}
                labelPlacement={"inner"}
                startColor={edgePreferences?.labelBorderColor || "#17457b"}
                onChange={(color: string) =>
                  onUserPrefsChange({ labelBorderColor: color })
                }
              />
              <Input
                label={"Border Width"}
                labelPlacement={"inner"}
                type={"number"}
                min={0}
                value={edgePreferences?.labelBorderWidth ?? 0}
                onChange={(value: number) =>
                  onUserPrefsChange({ labelBorderWidth: value })
                }
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Border Style"}
                labelPlacement={"inner"}
                value={edgePreferences?.labelBorderStyle || "solid"}
                onChange={value =>
                  onUserPrefsChange({ labelBorderStyle: value as LineStyle })
                }
                options={LINE_STYLE_OPTIONS}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <p>Line Styling</p>
            <div className={"attrs-container"}>
              <ColorInput
                label={"Color"}
                labelPlacement={"inner"}
                startColor={edgePreferences?.lineColor || "#b3b3b3"}
                onChange={(color: string) =>
                  onUserPrefsChange({ lineColor: color })
                }
              />
              <Input
                label={"Thickness"}
                labelPlacement={"inner"}
                type={"number"}
                min={1}
                value={edgePreferences?.lineThickness || 2}
                onChange={(value: number) =>
                  onUserPrefsChange({ lineThickness: value })
                }
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Style"}
                labelPlacement={"inner"}
                value={edgePreferences?.lineStyle || "solid"}
                onChange={value =>
                  onUserPrefsChange({ lineStyle: value as LineStyle })
                }
                options={LINE_STYLE_OPTIONS}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <p>Arrows Styling</p>
            <div className={"attrs-container"}>
              <Select
                label={"Source"}
                labelPlacement={"inner"}
                value={edgePreferences?.sourceArrowStyle || "none"}
                onChange={value =>
                  onUserPrefsChange({ sourceArrowStyle: value as ArrowStyle })
                }
                options={SOURCE_ARROW_STYLE_OPTIONS}
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Target"}
                labelPlacement={"inner"}
                value={edgePreferences?.targetArrowStyle || "triangle"}
                onChange={value =>
                  onUserPrefsChange({ targetArrowStyle: value as ArrowStyle })
                }
                options={TARGET_ARROW_STYLE_OPTIONS}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div className={"actions"}>
            <Button onPress={onUserPrefsReset}>Reset to Default</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
