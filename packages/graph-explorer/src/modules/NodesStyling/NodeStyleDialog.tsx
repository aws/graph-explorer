import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
  DialogFooter,
} from "@/components/Dialog";
import {
  Button,
  FileButton,
  InputField,
  SelectField,
  VertexIcon,
} from "@/components";
import ColorInput from "@/components/ColorInput/ColorInput";
import { useNotification } from "@/components/NotificationProvider";
import { useDisplayVertexTypeConfig } from "@/core";
import {
  LineStyle,
  ShapeStyle,
  useVertexStyling,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { NODE_SHAPE } from "./nodeShape";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { atom, useAtom } from "jotai";

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
  const [customizeNodeType, setCustomizeNodeType] = useAtom(
    customizeNodeTypeAtom
  );

  return (
    <Dialog
      open={Boolean(customizeNodeType)}
      onOpenChange={open => !open && setCustomizeNodeType(undefined)}
    >
      {customizeNodeType ? (
        <DialogContent>
          <NodeDialogTitle vertexType={customizeNodeType} />
          <DialogBody>
            <Content vertexType={customizeNodeType} />
          </DialogBody>
          <DialogFooter>
            <ResetStylesButton vertexType={customizeNodeType} />
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function NodeDialogTitle({ vertexType }: { vertexType: string }) {
  const displayConfig = useDisplayVertexTypeConfig(vertexType);
  const t = useTranslations();

  return (
    <DialogHeader>
      <DialogTitle>{t("nodes-styling.title")}</DialogTitle>
      <DialogDescription>
        Customize styling for {displayConfig.displayLabel}
      </DialogDescription>
    </DialogHeader>
  );
}

function Content({ vertexType }: { vertexType: string }) {
  const t = useTranslations();

  const { vertexStyle, setVertexStyle } = useVertexStyling(vertexType);
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
      await setVertexStyle({ iconUrl: result, iconImageType: file.type });
    } catch (error) {
      console.error("Unable to convert uploaded image to base64: ", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-base font-medium">Display Attributes</p>
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Display Name Attribute"
            labelPlacement="inner"
            value={displayConfig.displayNameAttribute}
            onValueChange={value =>
              setVertexStyle({ displayNameAttribute: value })
            }
            options={selectOptions}
          />
          <SelectField
            label="Display Description Attribute"
            labelPlacement="inner"
            value={displayConfig.displayDescriptionAttribute}
            onValueChange={value =>
              setVertexStyle({
                longDisplayNameAttribute: value,
              })
            }
            options={selectOptions}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium">Shape and Icon</p>
        <div className="grid grid-cols-[1fr_auto] gap-4">
          <SelectField
            label="Style"
            labelPlacement="inner"
            value={vertexStyle?.shape || "ellipse"}
            onValueChange={value =>
              setVertexStyle({ shape: value as ShapeStyle })
            }
            options={NODE_SHAPE}
            className="grow"
          />
          <div className="grid grid-cols-[auto_auto] items-center">
            <VertexIcon
              vertexStyle={displayConfig.style}
              className="size-3/4 group-hover:hidden"
            />
            <FileButton
              accept="image/*"
              onChange={file => {
                file && convertImageToBase64AndSetNewIcon(file);
              }}
            >
              Upload Icon
            </FileButton>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium">Shape Styling</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorInput
            label="Color"
            labelPlacement="inner"
            color={vertexStyle?.color || "#17457b"}
            onChange={(color: string) => setVertexStyle({ color })}
          />
          <InputField
            label="Background Opacity"
            labelPlacement="inner"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={vertexStyle?.backgroundOpacity ?? 0.4}
            onChange={(value: number) =>
              setVertexStyle({ backgroundOpacity: value })
            }
          />
        </div>
      </div>
      <div>
        <div className="grid grid-cols-3 gap-2">
          <ColorInput
            label="Border Color"
            labelPlacement="inner"
            color={vertexStyle?.borderColor || "#17457b"}
            onChange={(color: string) => setVertexStyle({ borderColor: color })}
          />
          <InputField
            label="Border Width"
            labelPlacement="inner"
            type="number"
            min={0}
            value={vertexStyle?.borderWidth ?? 0}
            onChange={(value: number) => setVertexStyle({ borderWidth: value })}
          />
          <SelectField
            label="Border Style"
            labelPlacement="inner"
            value={vertexStyle?.borderStyle || "solid"}
            onValueChange={value =>
              setVertexStyle({ borderStyle: value as LineStyle })
            }
            options={LINE_STYLE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

function ResetStylesButton({ vertexType }: { vertexType: string }) {
  const { resetVertexStyle } = useVertexStyling(vertexType);

  return <Button onClick={resetVertexStyle}>Reset to Default</Button>;
}
