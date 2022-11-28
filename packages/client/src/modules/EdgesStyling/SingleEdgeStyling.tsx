import { Modal } from "@mantine/core";
import clone from "lodash/clone";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { Button, Input, Select, StylingIcon } from "../../components";
import ColorInput from "../../components/ColorInput/ColorInput";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import {
  ArrowStyle,
  EdgePreferences,
  LineStyle,
  userStylingAtom,
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

export type SingleEdgeStylingProps = {
  classNamePrefix?: string;
  edgeType: string;
  opened: boolean;
  onOpen(): void;
  onClose(): void;
};

const SingleEdgeStyling = ({
  classNamePrefix = "ft",
  edgeType,
  opened,
  onOpen,
  onClose,
}: SingleEdgeStylingProps) => {
  const config = useConfiguration();
  const t = useTranslations();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const userStyling = useRecoilValue(userStylingAtom);
  const textTransform = useTextTransform();
  const etConfig = config?.getEdgeTypeConfig(edgeType);
  const etPrefs = userStyling.edges?.find(e => e.type === edgeType);

  const [displayAs, setDisplayAs] = useState(
    etConfig?.displayLabel || textTransform(edgeType)
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

  const onUserPrefsChange = useRecoilCallback(
    ({ set }) => (prefs: Omit<EdgePreferences, "type">) => {
      set(userStylingAtom, prev => {
        const edges = Array.from(prev.edges || []);
        const updateIndex = edges.findIndex(e => e.type === edgeType);

        if (updateIndex === -1) {
          return {
            ...prev,
            edges: [...edges, { ...prefs, type: edgeType }],
          };
        }

        edges[updateIndex] = {
          ...edges[updateIndex],
          ...prefs,
          type: edgeType,
        };
        return {
          ...prev,
          edges,
        };
      });
    },
    [edgeType]
  );

  const onUserPrefsReset = useRecoilCallback(
    ({ set }) => () => {
      set(userStylingAtom, prev => {
        return {
          ...prev,
          edges: prev.edges?.filter(e => e.type !== edgeType),
        };
      });
    },
    [edgeType]
  );

  const onDisplayNameChange = useRecoilCallback(
    ({ set }) => (value: string | string[]) => {
      if (!edgeType) {
        return;
      }

      set(userStylingAtom, prevStyling => {
        const etItem = clone(
          prevStyling.edges?.find(e => e.type === edgeType) ||
            ({} as EdgePreferences)
        );

        etItem.displayNameAttribute = value as string;

        return {
          ...prevStyling,
          edges: [
            ...(prevStyling.edges || []).filter(e => e.type !== edgeType),
            {
              ...(etItem || {}),
              type: edgeType,
            },
          ],
        };
      });
    },
    [edgeType]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChange = useCallback(
    debounce((displayLabel?: string) => {
      onUserPrefsChange({ displayLabel });
    }, 400),
    [onUserPrefsChange]
  );

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    debouncedChange(displayAs);
  }, [displayAs, debouncedChange]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("title")}>
        <div className={pfx("edge-name")}>{edgeType}</div>
      </div>
      <div className={pfx("label-container")}>
        <Input
          className={pfx("label-display")}
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
        className={styleWithTheme(modalDefaultStyles(classNamePrefix))}
        overlayOpacity={0.1}
      >
        <div className={pfx("container")}>
          <div>
            <p>Display Attributes</p>
            <div className={pfx("attrs-container")}>
              <Select
                label={"Display Name Attribute"}
                labelPlacement={"inner"}
                value={etConfig?.displayNameAttribute || "type"}
                onChange={onDisplayNameChange}
                options={selectOptions}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <p>Label Styling</p>
            <div className={pfx("attrs-container")}>
              <ColorInput
                label={"Color"}
                labelPlacement={"inner"}
                startColor={etPrefs?.labelColor || "#17457b"}
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
                value={etPrefs?.labelBackgroundOpacity ?? 0.7}
                onChange={(value: number) =>
                  onUserPrefsChange({ labelBackgroundOpacity: value })
                }
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <div className={pfx("attrs-container")}>
              <ColorInput
                label={"Border Color"}
                labelPlacement={"inner"}
                startColor={etPrefs?.labelBorderColor || "#17457b"}
                onChange={(color: string) =>
                  onUserPrefsChange({ labelBorderColor: color })
                }
              />
              <Input
                label={"Border Width"}
                labelPlacement={"inner"}
                type={"number"}
                min={0}
                value={etPrefs?.labelBorderWidth ?? 0}
                onChange={(value: number) =>
                  onUserPrefsChange({ labelBorderWidth: value })
                }
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Border Style"}
                labelPlacement={"inner"}
                value={etPrefs?.labelBorderStyle || "solid"}
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
            <div className={pfx("attrs-container")}>
              <ColorInput
                label={"Color"}
                labelPlacement={"inner"}
                startColor={etPrefs?.lineColor || "#b3b3b3"}
                onChange={(color: string) =>
                  onUserPrefsChange({ lineColor: color })
                }
              />
              <Input
                label={"Thickness"}
                labelPlacement={"inner"}
                type={"number"}
                min={1}
                value={etPrefs?.lineThickness || 2}
                onChange={(value: number) =>
                  onUserPrefsChange({ lineThickness: value })
                }
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Style"}
                labelPlacement={"inner"}
                value={etPrefs?.lineStyle || "solid"}
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
            <div className={pfx("attrs-container")}>
              <Select
                label={"Source"}
                labelPlacement={"inner"}
                value={etPrefs?.sourceArrowStyle || "none"}
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
                value={etPrefs?.targetArrowStyle || "triangle"}
                onChange={value =>
                  onUserPrefsChange({ targetArrowStyle: value as ArrowStyle })
                }
                options={TARGET_ARROW_STYLE_OPTIONS}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div className={pfx("actions")}>
            <Button onPress={onUserPrefsReset}>Reset to Default</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SingleEdgeStyling;
