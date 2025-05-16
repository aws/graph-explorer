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
  FileButton,
  IconButton,
  InputField,
  SelectField,
  UploadIcon,
  VertexSymbol,
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
      onOpenChange={opened => {
        if (!opened) {
          setCustomizeNodeType(undefined);
        }
      }}
    >
      <DialogContent>
        {customizeNodeType ? <Content vertexType={customizeNodeType} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Content({ vertexType }: { vertexType: string }) {
  const t = useTranslations();

  const { vertexStyle, setVertexStyle, resetVertexStyle } =
    useVertexStyling(vertexType);
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
    <>
      <DialogHeader>
        <DialogTitle>Customize Node Style</DialogTitle>
        <DialogDescription>
          Customize styles for node type {displayConfig.displayLabel}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-4">
          <div className="font-medium leading-none">Display Attributes</div>
          <div className="flex gap-4">
            <SelectField
              label="Display Name Attribute"
              labelPlacement="inner"
              value={displayConfig.displayNameAttribute}
              onValueChange={value =>
                setVertexStyle({ displayNameAttribute: value })
              }
              options={selectOptions}
              className="w-full"
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
              className="w-full"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="font-medium leading-none">Shape and Icon</div>
          <div className="flex flex-row items-center gap-4">
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
            <FileButton
              accept="image/*"
              onChange={file => {
                file && convertImageToBase64AndSetNewIcon(file);
              }}
              asChild
            >
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
              />
            </FileButton>
          </div>
        </div>
        <div className="space-y-4">
          <div className="font-medium leading-none">Shape Styling</div>
          <div className="flex gap-4">
            <ColorInput
              label="Color"
              labelPlacement="inner"
              color={vertexStyle?.color || "#17457b"}
              onChange={(color: string) => setVertexStyle({ color })}
              className="w-full"
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
              className="w-full"
            />
          </div>
          <div className="flex gap-4">
            <ColorInput
              label="Border Color"
              labelPlacement="inner"
              color={vertexStyle?.borderColor || "#17457b"}
              onChange={(color: string) =>
                setVertexStyle({ borderColor: color })
              }
              className="w-full"
            />
            <InputField
              label="Border Width"
              labelPlacement="inner"
              type="number"
              min={0}
              value={vertexStyle?.borderWidth ?? 0}
              onChange={(value: number) =>
                setVertexStyle({ borderWidth: value })
              }
              className="w-full"
            />
            <SelectField
              label="Border Style"
              labelPlacement="inner"
              value={vertexStyle?.borderStyle || "solid"}
              onValueChange={value =>
                setVertexStyle({ borderStyle: value as LineStyle })
              }
              options={LINE_STYLE_OPTIONS}
              className="w-full"
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        <Button onPress={() => resetVertexStyle()}>Reset to Default</Button>
        <DialogClose asChild>
          <Button variant="filled">Done</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
