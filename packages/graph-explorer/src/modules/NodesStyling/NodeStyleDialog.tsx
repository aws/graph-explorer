import { atom, useAtom, useSetAtom } from "jotai";
import { ImageUpIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  ColorPopover,
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FileButton,
  IconPicker,
  NumberInput,
  PreviewSurface,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VertexPreview,
} from "@/components";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import { useDisplayVertexTypeConfig, type VertexType } from "@/core";
import {
  type LineStyle,
  type ShapeStyle,
  useVertexStyling,
} from "@/core/StateProvider/graphStyles";
import { isAllowedIconValue } from "@/core/styling";
import { useTextTransform } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { createDisplayError } from "@/utils/createDisplayError";

import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { NODE_SHAPE } from "./nodeShape";

const customizeNodeTypeAtom = atom<VertexType | undefined>(undefined);

/**
 * Open the dialog to customize the node style
 * @returns callback to open the dialog
 */
export function useOpenNodeStyleDialog() {
  const setCustomizeNodeType = useSetAtom(customizeNodeTypeAtom);

  return (vertexType: VertexType) => {
    setCustomizeNodeType(vertexType);
  };
}

const file2Base64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : resolve("");
    reader.onerror = reject;
  });
};

export function NodeStyleDialog() {
  const [customizeNodeType, setCustomizeNodeType] = useAtom(
    customizeNodeTypeAtom,
  );

  return (
    <Dialog
      open={Boolean(customizeNodeType)}
      onOpenChange={open => !open && setCustomizeNodeType(undefined)}
    >
      {customizeNodeType ? <Content vertexType={customizeNodeType} /> : null}
    </Dialog>
  );
}

function Content({ vertexType }: { vertexType: VertexType }) {
  const t = useTranslations();
  const textTransform = useTextTransform();

  const { vertexStyle, setVertexStyle, resetVertexStyle } =
    useVertexStyling(vertexType);
  const displayConfig = useDisplayVertexTypeConfig(vertexType);

  const selectOptions = (() => {
    const options = displayConfig.attributes.map(attr => ({
      label: attr.displayLabel,
      value: attr.name,
    }));

    options.unshift({
      label: t("node-type"),
      value: RESERVED_TYPES_PROPERTY,
    });
    options.unshift({
      label: t("node-id"),
      value: RESERVED_ID_PROPERTY,
    });

    return options;
  })();

  const convertImageToBase64AndSetNewIcon = async (file: File) => {
    if (file.size > 50 * 1024) {
      toast.error("Invalid file", {
        description: "File size too large. Maximum 50Kb",
      });
      return;
    }
    try {
      const result = await file2Base64(file);
      if (!isAllowedIconValue(result)) {
        toast.error("Invalid file", {
          description: "Choose an image file (the icon must be an image).",
        });
        return;
      }
      setVertexStyle({ iconUrl: result, iconImageType: file.type });
    } catch (error) {
      console.error("Unable to convert uploaded image to base64: ", error);
      toast.error("Invalid file", {
        description: createDisplayError(error).message,
      });
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <form className="flex min-h-0 flex-col">
        <DialogHeader>
          <DialogTitle>Customize Your {t("node")} Style</DialogTitle>
          <DialogDescription>
            Changes here override the default style for this {t("node-type")}.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>Display Name {t("property")}</FieldLabel>
                <Select
                  value={vertexStyle.displayNameAttribute}
                  onValueChange={value =>
                    setVertexStyle({ displayNameAttribute: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose display name attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Display Description {t("property")}</FieldLabel>
                <Select
                  value={vertexStyle.longDisplayNameAttribute}
                  onValueChange={value =>
                    setVertexStyle({ longDisplayNameAttribute: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose display name attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field className="col-start-1 row-start-1">
                <FieldLabel>Shape</FieldLabel>
                <Select
                  value={vertexStyle.shape}
                  onValueChange={value =>
                    setVertexStyle({ shape: value as ShapeStyle })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose shape" />
                  </SelectTrigger>
                  <SelectContent>
                    {NODE_SHAPE.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="col-start-1 row-start-2">
                <FieldLabel>Icon</FieldLabel>
                <div className="grid grid-cols-2 items-center gap-2">
                  <IconPicker
                    currentIconUrl={vertexStyle.iconUrl}
                    onSelect={(iconUrl, iconImageType) =>
                      setVertexStyle({ iconUrl, iconImageType })
                    }
                  >
                    <Button variant="outline">
                      <SearchIcon className="size-4" />
                      Browse
                    </Button>
                  </IconPicker>
                  <FileButton
                    accept="image/*"
                    onChange={file => {
                      if (file) {
                        convertImageToBase64AndSetNewIcon(file);
                      }
                    }}
                    variant="outline"
                  >
                    <ImageUpIcon />
                    Upload
                  </FileButton>
                </div>
              </Field>

              <Field className="col-start-2 row-span-2">
                <FieldLabel>Preview</FieldLabel>
                <PreviewSurface className="flex-1">
                  <VertexPreview
                    vertexStyle={vertexStyle}
                    transform={textTransform}
                    className="zoom-50"
                  />
                </PreviewSurface>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>{t("node")} Color</FieldLabel>
                  <ColorPopover
                    color={vertexStyle.color}
                    onColorChange={(color: string) => setVertexStyle({ color })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Background Opacity</FieldLabel>
                  <NumberInput
                    min={0}
                    max={1}
                    step={0.1}
                    value={vertexStyle.backgroundOpacity}
                    onValueChange={backgroundOpacity =>
                      setVertexStyle({ backgroundOpacity })
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel>Border Color</FieldLabel>
                  <ColorPopover
                    color={vertexStyle.borderColor}
                    onColorChange={(color: string) =>
                      setVertexStyle({ borderColor: color })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Border Width</FieldLabel>
                  <NumberInput
                    min={0}
                    step={0.5}
                    value={vertexStyle.borderWidth}
                    onValueChange={borderWidth =>
                      setVertexStyle({ borderWidth })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Border Style</FieldLabel>
                  <Select
                    value={vertexStyle.borderStyle}
                    onValueChange={value =>
                      setVertexStyle({ borderStyle: value as LineStyle })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose border style" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_STYLE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline-danger"
            onClick={resetVertexStyle}
          >
            Clear Customization
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="primary">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
