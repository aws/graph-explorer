import { FileButton, Modal } from "@mantine/core";
import {
  Button,
  IconButton,
  InputField,
  SelectField,
  UploadIcon,
  VertexSymbol,
} from "@/components";
import ColorInput from "@/components/ColorInput/ColorInput";
import { useNotification } from "@/components/NotificationProvider";
import { useDisplayVertexTypeConfig, useWithTheme } from "@/core";
import {
  LineStyle,
  ShapeStyle,
  userStylingNodeAtom,
  VertexPreferences,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { NODE_SHAPE } from "./nodeShape";
import modalDefaultStyles from "./SingleNodeStylingModal.style";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { atom, useAtom } from "jotai";
import { useResetAtom } from "jotai/utils";

export const customizeNodeTypeAtom = atom<string | undefined>(undefined);

const file2Base64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : resolve("");
    reader.onerror = reject;
  });
};

export default function NodeStyleDialog() {
  const styleWithTheme = useWithTheme();

  const [customizeNodeType, setCustomizeNodeType] = useAtom(
    customizeNodeTypeAtom
  );

  return (
    <Modal
      opened={Boolean(customizeNodeType)}
      onClose={() => setCustomizeNodeType(undefined)}
      centered={true}
      size="auto"
      title={
        customizeNodeType ? (
          <DialogTitle vertexType={customizeNodeType} />
        ) : null
      }
      className={styleWithTheme(modalDefaultStyles)}
      overlayProps={{
        backgroundOpacity: 0.1,
      }}
    >
      {customizeNodeType ? <Content vertexType={customizeNodeType} /> : null}
    </Modal>
  );
}

function DialogTitle({ vertexType }: { vertexType: string }) {
  const displayConfig = useDisplayVertexTypeConfig(vertexType);
  return (
    <div>
      Customize <strong>{displayConfig.displayLabel}</strong>
    </div>
  );
}

function Content({ vertexType }: { vertexType: string }) {
  const t = useTranslations();

  const [nodePreferences, setNodePreferences] = useAtom(
    userStylingNodeAtom(vertexType)
  );
  const displayConfig = useDisplayVertexTypeConfig(vertexType);

  const selectOptions = (() => {
    const options = displayConfig.attributes.map(attr => ({
      label: attr.displayLabel,
      value: attr.name,
    }));

    options.unshift({
      label: t("nodes-styling.node-type"),
      value: RESERVED_TYPES_PROPERTY,
    });
    options.unshift({
      label: t("nodes-styling.node-id"),
      value: RESERVED_ID_PROPERTY,
    });

    return options;
  })();

  const onUserPrefsChange = (prefs: Omit<VertexPreferences, "type">) => {
    setNodePreferences({ type: vertexType, ...prefs });
  };

  const reset = useResetAtom(userStylingNodeAtom(vertexType));

  const { enqueueNotification } = useNotification();
  const convertImageToBase64AndSetNewIcon = async (file: File) => {
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
  };

  return (
    <div className="modal-container">
      <div>
        <p>Display Attributes</p>
        <div className="attrs-container">
          <SelectField
            label="Display Name Attribute"
            labelPlacement="inner"
            value={displayConfig.displayNameAttribute}
            onValueChange={value => {
              onUserPrefsChange({ displayNameAttribute: value });
            }}
            options={selectOptions}
          />
          <SelectField
            label="Display Description Attribute"
            labelPlacement="inner"
            value={displayConfig.displayDescriptionAttribute}
            onValueChange={value => {
              onUserPrefsChange({
                longDisplayNameAttribute: value,
              });
            }}
            options={selectOptions}
          />
        </div>
      </div>
      <div>
        <p>Shape and Icon</p>
        <div className="flex flex-row items-center gap-2">
          <SelectField
            label="Style"
            labelPlacement="inner"
            value={nodePreferences?.shape || "ellipse"}
            onValueChange={value =>
              onUserPrefsChange({ shape: value as ShapeStyle })
            }
            options={NODE_SHAPE}
            className="grow"
          />
          <FileButton
            accept="image/*"
            onChange={file => {
              file && convertImageToBase64AndSetNewIcon(file);
            }}
          >
            {props => (
              <IconButton
                variant="filled"
                className="text-text-primary hover:text-text-primary group rounded-full border-0 bg-transparent p-0 hover:cursor-pointer hover:bg-gray-200"
                icon={
                  <>
                    <div className="hidden group-hover:flex">
                      <UploadIcon />
                    </div>
                    <VertexSymbol
                      vertexStyle={displayConfig.style}
                      className="size-full group-hover:hidden"
                    />
                  </>
                }
                tooltipText="Upload New Icon"
                onClick={props.onClick}
              />
            )}
          </FileButton>
        </div>
      </div>
      <div>
        <p>Shape Styling</p>
        <div className="attrs-container">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            color={nodePreferences?.color || "#17457b"}
            onChange={(color: string) => onUserPrefsChange({ color })}
          />
          <InputField
            label="Background Opacity"
            labelPlacement="inner"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={nodePreferences?.backgroundOpacity ?? 0.4}
            onChange={(value: number) =>
              onUserPrefsChange({ backgroundOpacity: value })
            }
          />
        </div>
      </div>
      <div>
        <div className="attrs-container">
          <ColorInput
            label="Border Color"
            labelPlacement="inner"
            color={nodePreferences?.borderColor || "#17457b"}
            onChange={(color: string) =>
              onUserPrefsChange({ borderColor: color })
            }
          />
          <InputField
            label="Border Width"
            labelPlacement="inner"
            type="number"
            min={0}
            value={nodePreferences?.borderWidth ?? 0}
            onChange={(value: number) =>
              onUserPrefsChange({ borderWidth: value })
            }
          />
          <SelectField
            label="Border Style"
            labelPlacement="inner"
            value={nodePreferences?.borderStyle || "solid"}
            onValueChange={value =>
              onUserPrefsChange({ borderStyle: value as LineStyle })
            }
            options={LINE_STYLE_OPTIONS}
          />
        </div>
      </div>
      <div className="actions">
        <Button onPress={() => reset()}>Reset to Default</Button>
      </div>
    </div>
  );
}
