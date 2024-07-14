import { FileButton, Modal } from "@mantine/core";
import clone from "lodash/clone";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  Button,
  IconButton,
  Input,
  RemoteSvgIcon,
  Select,
  StylingIcon,
  UploadIcon,
} from "../../components";
import ColorInput from "../../components/ColorInput/ColorInput";
import { useNotification } from "../../components/NotificationProvider";
import { useConfiguration, useWithTheme } from "../../core";
import {
  LineStyle,
  ShapeStyle,
  userStylingAtom,
  VertexPreferences,
} from "../../core/StateProvider/userPreferences";
import fade from "../../core/ThemeProvider/utils/fade";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { NODE_SHAPE } from "./nodeShape";
import defaultStyles from "./SingleNodeStyling.style";
import modalDefaultStyles from "./SingleNodeStylingModal.style";

export type SingleNodeStylingProps = {
  vertexType: string;
  opened: boolean;
  onOpen(): void;
  onClose(): void;
};

const file2Base64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = reject;
  });
};

const SingleNodeStyling = ({
  vertexType,
  opened,
  onOpen,
  onClose,
}: SingleNodeStylingProps) => {
  const config = useConfiguration();
  const t = useTranslations();
  const styleWithTheme = useWithTheme();

  const userStyling = useRecoilValue(userStylingAtom);
  const textTransform = useTextTransform();
  const vtConfig = config?.getVertexTypeConfig(vertexType);
  const vtPrefs = userStyling.vertices?.find(v => v.type === vertexType);

  const [displayAs, setDisplayAs] = useState(
    vtConfig?.displayLabel || textTransform(vertexType)
  );

  const selectOptions = useMemo(() => {
    const options =
      vtConfig?.attributes.map(attr => ({
        value: attr.name,
        label: attr.displayLabel || textTransform(attr.name),
      })) || [];

    options.unshift({
      label: t("nodes-styling.node-type"),
      value: "types",
    });
    options.unshift({ label: t("nodes-styling.node-id"), value: "id" });

    return options;
  }, [t, textTransform, vtConfig?.attributes]);

  const onUserPrefsChange = useRecoilCallback(
    ({ set }) =>
      (prefs: Omit<VertexPreferences, "type">) => {
        set(userStylingAtom, prev => {
          const vertices = Array.from(prev.vertices || []);
          const updateIndex = vertices.findIndex(v => v.type === vertexType);

          if (updateIndex === -1) {
            return {
              ...prev,
              vertices: [...vertices, { ...prefs, type: vertexType }],
            };
          }

          vertices[updateIndex] = {
            ...vertices[updateIndex],
            ...prefs,
            type: vertexType,
          };
          return {
            ...prev,
            vertices,
          };
        });
      },
    [vertexType]
  );

  const onUserPrefsReset = useRecoilCallback(
    ({ set }) =>
      () => {
        set(userStylingAtom, prev => {
          return {
            ...prev,
            vertices: prev.vertices?.filter(e => e.type !== vertexType),
          };
        });
      },
    [vertexType]
  );

  const onDisplayNameChange = useRecoilCallback(
    ({ set }) =>
      (field: "name" | "longName") =>
      (value: string | string[]) => {
        if (!vertexType) {
          return;
        }

        set(userStylingAtom, prevStyling => {
          const vtItem =
            clone(prevStyling.vertices?.find(v => v.type === vertexType)) ||
            ({} as VertexPreferences);

          if (field === "name") {
            vtItem.displayNameAttribute = value as string;
          }

          if (field === "longName") {
            vtItem.longDisplayNameAttribute = value as string;
          }

          return {
            ...prevStyling,
            vertices: [
              ...(prevStyling.vertices || []).filter(
                v => v.type !== vertexType
              ),
              {
                ...(vtItem || {}),
                type: vertexType,
              },
            ],
          };
        });
      },
    [vertexType]
  );

  const { enqueueNotification } = useNotification();
  const convertImageToBase64AndSetNewIcon = useCallback(
    async (file: File) => {
      if (file.size > 50 * 1024) {
        enqueueNotification({
          title: "Invalid file",
          message: "File size too large. Maximum 50Kb",
          type: "error",
        });
        return;
      }
      try {
        const result = await file2Base64(file);
        onUserPrefsChange({ iconUrl: result, iconImageType: file.type });
      } catch (error) {
        console.error("Unable to convert uploaded image to base64: ", error);
      }
    },
    [enqueueNotification, onUserPrefsChange]
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

  const isSvg =
    (vtPrefs?.iconImageType || vtConfig?.iconImageType) === "image/svg+xml";

  return (
    <div className={styleWithTheme(defaultStyles)}>
      <div className={"title"}>
        <div className={"vertex-name"}>{vertexType}</div>
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
            Customize <strong>{displayAs || vertexType}</strong>
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
                value={vtConfig?.displayNameAttribute || ""}
                onChange={onDisplayNameChange("name")}
                options={selectOptions}
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Display Description Attribute"}
                labelPlacement={"inner"}
                value={vtConfig?.longDisplayNameAttribute || ""}
                onChange={onDisplayNameChange("longName")}
                options={selectOptions}
                hideError={true}
                noMargin={true}
              />
            </div>
          </div>
          <div>
            <p>Shape and Icon</p>
            <div className={"attrs-container"}>
              <Select
                label={"Style"}
                labelPlacement={"inner"}
                value={vtPrefs?.shape || "ellipse"}
                onChange={value =>
                  onUserPrefsChange({ shape: value as ShapeStyle })
                }
                options={NODE_SHAPE}
                hideError={true}
                noMargin={true}
              />
              <div className={"icon"}>
                <FileButton
                  accept={"image/*"}
                  onChange={file => {
                    file && convertImageToBase64AndSetNewIcon(file);
                  }}
                >
                  {props => (
                    <IconButton
                      icon={
                        <div>
                          <div className={"upload-icon"}>
                            <UploadIcon />
                          </div>
                          <div
                            className={"vertex-icon"}
                            style={{
                              background: fade(vtConfig?.color, 0.2),
                              color: vtConfig?.color,
                            }}
                          >
                            {isSvg && (
                              <RemoteSvgIcon
                                src={
                                  vtPrefs?.iconUrl || vtConfig?.iconUrl || ""
                                }
                              />
                            )}
                            {!isSvg && (
                              <img
                                width={24}
                                height={24}
                                src={vtPrefs?.iconUrl || vtConfig?.iconUrl}
                              />
                            )}
                          </div>
                        </div>
                      }
                      tooltipText={"Upload New Icon"}
                      tooltipPlacement={"bottom-end"}
                      onClick={props.onClick}
                    />
                  )}
                </FileButton>
              </div>
            </div>
          </div>
          <div>
            <p>Shape Styling</p>
            <div className={"attrs-container"}>
              <ColorInput
                label={"Color"}
                labelPlacement={"inner"}
                startColor={vtPrefs?.color || "#17457b"}
                onChange={(color: string) => onUserPrefsChange({ color })}
              />
              <Input
                label={"Background Opacity"}
                labelPlacement={"inner"}
                type={"number"}
                min={0}
                max={1}
                step={0.1}
                value={vtPrefs?.backgroundOpacity ?? 0.4}
                onChange={(value: number) =>
                  onUserPrefsChange({ backgroundOpacity: value })
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
                startColor={vtPrefs?.borderColor || "#17457b"}
                onChange={(color: string) =>
                  onUserPrefsChange({ borderColor: color })
                }
              />
              <Input
                label={"Border Width"}
                labelPlacement={"inner"}
                type={"number"}
                min={0}
                value={vtPrefs?.borderWidth ?? 0}
                onChange={(value: number) =>
                  onUserPrefsChange({ borderWidth: value })
                }
                hideError={true}
                noMargin={true}
              />
              <Select
                label={"Border Style"}
                labelPlacement={"inner"}
                value={vtPrefs?.borderStyle || "solid"}
                onChange={value =>
                  onUserPrefsChange({ borderStyle: value as LineStyle })
                }
                options={LINE_STYLE_OPTIONS}
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
};

export default SingleNodeStyling;
