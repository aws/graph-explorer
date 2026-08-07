import type { ArrowStyle, EdgeStyle, LineStyle } from "@/core";

import {
  ColorPopover,
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  NumberInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";

import { ARROW_STYLE_OPTIONS } from "./arrowsStyling";
import { LINE_STYLE_OPTIONS } from "./lineStyling";

/** The edge appearance fields a user edits — never the type or the nested conditional style. */
export type EdgeStyleUpdate = Partial<
  Omit<EdgeStyle, "type" | "conditionalStyle">
>;

type EdgeStyleFieldsProps = {
  /** The resolved style whose values populate the controls. */
  style: EdgeStyle;
  /** Called with the changed field(s) to merge into the edited style. */
  onChange: (update: EdgeStyleUpdate) => void;
};

/**
 * The edge visual style controls — label styling and line styling — shared by
 * the base and conditional style panes. Display name is type-level, so it lives
 * only in the base dialog, not here.
 */
export function EdgeStyleFields({ style, onChange }: EdgeStyleFieldsProps) {
  return (
    <>
      <FieldSet>
        <FieldLegend>Label Styling</FieldLegend>
        <FieldGroup className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Background Color</FieldLabel>
            <ColorPopover
              color={style.labelColor}
              onColorChange={color => onChange({ labelColor: color })}
            />
          </Field>
          <Field>
            <FieldLabel>Background Opacity</FieldLabel>
            <NumberInput
              min={0}
              max={1}
              step={0.1}
              value={style.labelBackgroundOpacity}
              onValueChange={labelBackgroundOpacity =>
                onChange({ labelBackgroundOpacity })
              }
            />
          </Field>
        </FieldGroup>
        <FieldGroup className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Border Color</FieldLabel>
            <ColorPopover
              color={style.labelBorderColor}
              onColorChange={color => onChange({ labelBorderColor: color })}
            />
          </Field>
          <Field>
            <FieldLabel>Border Width</FieldLabel>
            <NumberInput
              min={0}
              step={0.5}
              value={style.labelBorderWidth}
              onValueChange={labelBorderWidth => onChange({ labelBorderWidth })}
            />
          </Field>
          <Field>
            <FieldLabel>Border Style</FieldLabel>
            <Select
              value={style.labelBorderStyle}
              onValueChange={value =>
                onChange({ labelBorderStyle: value as LineStyle })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a border style" />
              </SelectTrigger>
              <SelectContent>
                {LINE_STYLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-row items-center gap-3">
                      {option.label}
                      {option.icon}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Line Styling</FieldLegend>
        <FieldGroup className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Line Color</FieldLabel>
            <ColorPopover
              color={style.lineColor}
              onColorChange={color => onChange({ lineColor: color })}
            />
          </Field>
          <Field>
            <FieldLabel>Line Thickness</FieldLabel>
            <NumberInput
              min={1}
              step={0.5}
              value={style.lineThickness}
              onValueChange={lineThickness => onChange({ lineThickness })}
            />
          </Field>
          <Field>
            <FieldLabel>Line Style</FieldLabel>
            <Select
              value={style.lineStyle}
              onValueChange={value =>
                onChange({ lineStyle: value as LineStyle })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a line style" />
              </SelectTrigger>
              <SelectContent>
                {LINE_STYLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-row items-center gap-3">
                      {option.label}
                      {option.icon}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <FieldGroup className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Source Arrow Style</FieldLabel>
            <Select
              value={style.sourceArrowStyle}
              onValueChange={value =>
                onChange({ sourceArrowStyle: value as ArrowStyle })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source arrow style" />
              </SelectTrigger>
              <SelectContent>
                {ARROW_STYLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-row items-center gap-3">
                      {option.label}
                      <option.Icon className="rotate-180" />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Target Arrow Style</FieldLabel>
            <Select
              value={style.targetArrowStyle}
              onValueChange={value =>
                onChange({ targetArrowStyle: value as ArrowStyle })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a target arrow style" />
              </SelectTrigger>
              <SelectContent>
                {ARROW_STYLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-row items-center gap-3">
                      {option.label}
                      <option.Icon />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </FieldSet>
    </>
  );
}
