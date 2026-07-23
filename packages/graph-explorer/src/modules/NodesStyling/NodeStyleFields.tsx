import { ImageUpIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import type { LineStyle, ShapeStyle, VertexStyle } from "@/core";

import {
  Button,
  ColorPopover,
  Field,
  FieldGroup,
  FieldLabel,
  FileButton,
  IconPicker,
  NumberInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { isAllowedIconValue } from "@/core/styling";
import useTranslations from "@/hooks/useTranslations";
import { createDisplayError } from "@/utils/createDisplayError";

import { LINE_STYLE_OPTIONS } from "./lineStyling";
import { NODE_SHAPE } from "./nodeShape";

/** The vertex appearance fields a user edits — never the type or the nested conditional style. */
export type VertexStyleUpdate = Partial<
  Omit<VertexStyle, "type" | "conditionalStyle">
>;

type NodeStyleFieldsProps = {
  /** The resolved style whose values populate the controls. */
  style: VertexStyle;
  /** Called with the changed field(s) to merge into the edited style. */
  onChange: (update: VertexStyleUpdate) => void;
};

const file2Base64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : resolve("");
    reader.onerror = reject;
  });
};

/**
 * The vertex visual style controls — shape, icon, color, and border — shared by
 * the base and conditional style panes. Display name/description are type-level
 * (not per-condition), so they live only in the base dialog, not here.
 */
export function NodeStyleFields({ style, onChange }: NodeStyleFieldsProps) {
  const t = useTranslations();

  const uploadIcon = async (file: File) => {
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
      onChange({ iconUrl: result, iconImageType: file.type });
    } catch (error) {
      console.error("Unable to convert uploaded image to base64: ", error);
      toast.error("Invalid file", {
        description: createDisplayError(error).message,
      });
    }
  };

  return (
    <>
      <FieldGroup className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Shape</FieldLabel>
          <Select
            value={style.shape}
            onValueChange={value => onChange({ shape: value as ShapeStyle })}
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
        <Field>
          <FieldLabel>Icon</FieldLabel>
          <div className="grid grid-cols-2 items-center gap-2">
            <IconPicker
              currentIconUrl={style.iconUrl}
              onSelect={(iconUrl, iconImageType) =>
                onChange({ iconUrl, iconImageType })
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
                  uploadIcon(file);
                }
              }}
              variant="outline"
            >
              <ImageUpIcon />
              Upload
            </FileButton>
          </div>
        </Field>
      </FieldGroup>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>{t("node")} Color</FieldLabel>
            <ColorPopover
              color={style.color}
              onColorChange={(color: string) => onChange({ color })}
            />
          </Field>
          <Field>
            <FieldLabel>Background Opacity</FieldLabel>
            <NumberInput
              min={0}
              max={1}
              step={0.1}
              value={style.backgroundOpacity}
              onValueChange={backgroundOpacity =>
                onChange({ backgroundOpacity })
              }
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Border Color</FieldLabel>
            <ColorPopover
              color={style.borderColor}
              onColorChange={(color: string) =>
                onChange({ borderColor: color })
              }
            />
          </Field>
          <Field>
            <FieldLabel>Border Width</FieldLabel>
            <NumberInput
              min={0}
              step={0.5}
              value={style.borderWidth}
              onValueChange={borderWidth => onChange({ borderWidth })}
            />
          </Field>
          <Field>
            <FieldLabel>Border Style</FieldLabel>
            <Select
              value={style.borderStyle}
              onValueChange={value =>
                onChange({ borderStyle: value as LineStyle })
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
    </>
  );
}
