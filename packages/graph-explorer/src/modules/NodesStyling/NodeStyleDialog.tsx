import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/Dialog";
import {
  Button,
  ColorPopover,
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FileButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VertexSymbol,
} from "@/components";
import { toast } from "sonner";
import { useDisplayVertexTypeConfig } from "@/core";
import {
  type LineStyle,
  type ShapeStyle,
  useVertexStyling,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { NODE_SHAPE } from "./nodeShape";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { atom, useAtom, useSetAtom } from "jotai";
import { ImageUpIcon } from "lucide-react";
import { parseNumberSafely } from "@/utils";

const customizeNodeTypeAtom = atom<string | undefined>(undefined);

/**
 * Open the dialog to customize the node style
 * @returns callback to open the dialog
 */
export function useOpenNodeStyleDialog() {
  const setCustomizeNodeType = useSetAtom(customizeNodeTypeAtom);

  return (vertexType: string) => {
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

  const convertImageToBase64AndSetNewIcon = async (file: File) => {
    if (file.size > 50 * 1024) {
      toast.error("Invalid file", {
        description: "File size too large. Maximum 50Kb",
      });
      return;
    }
    try {
      const result = await file2Base64(file);
      setVertexStyle({ iconUrl: result, iconImageType: file.type });
    } catch (error) {
      console.error("Unable to convert uploaded image to base64: ", error);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <form>
        <DialogHeader>
          <DialogTitle>{t("nodes-styling.title")}</DialogTitle>
          <DialogDescription>
            Customize styling for {displayConfig.displayLabel}
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
            <FieldGroup className="flex w-full flex-row gap-4">
              <div className="flex-1">
                <Field>
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
              </div>
              <div>
                <Field>
                  <FieldLabel>Icon</FieldLabel>
                  <div className="flex flex-row items-center gap-2">
                    <FileButton
                      accept="image/*"
                      onChange={file => {
                        file && convertImageToBase64AndSetNewIcon(file);
                      }}
                      variant="outline"
                      className="rounded-full"
                    >
                      <ImageUpIcon />
                      Upload
                    </FileButton>
                    <VertexSymbol vertexStyle={vertexStyle} />
                  </div>
                </Field>
              </div>
            </FieldGroup>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>{t("graph-viewer.node")} Color</FieldLabel>
                  <ColorPopover
                    color={vertexStyle.color}
                    onColorChange={(color: string) => setVertexStyle({ color })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Background Opacity</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={vertexStyle.backgroundOpacity}
                    onChange={e =>
                      setVertexStyle({
                        backgroundOpacity: parseNumberSafely(e.target.value),
                      })
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
                  <Input
                    type="number"
                    min={0}
                    value={vertexStyle.borderWidth}
                    onChange={e =>
                      setVertexStyle({
                        borderWidth: parseNumberSafely(e.target.value),
                      })
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
          <Button type="button" color="danger" onClick={resetVertexStyle}>
            Reset to Default
          </Button>
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
