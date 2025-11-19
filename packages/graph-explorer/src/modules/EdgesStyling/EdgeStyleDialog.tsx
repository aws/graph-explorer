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
  FieldLegend,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { useDisplayEdgeTypeConfig } from "@/core";
import {
  type ArrowStyle,
  type LineStyle,
  useEdgeStyling,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import { ARROW_STYLE_OPTIONS } from "./arrowsStyling";
import { parseNumberSafely, RESERVED_TYPES_PROPERTY } from "@/utils";
import { atom, useAtom, useSetAtom } from "jotai";
import { LINE_STYLE_OPTIONS } from "./lineStyling";

const customizeEdgeTypeAtom = atom<string | undefined>(undefined);

/**
 * Open the dialog to customize the edge style
 * @returns callback to open the dialog
 */
export function useOpenEdgeStyleDialog() {
  const setCustomizeEdgeType = useSetAtom(customizeEdgeTypeAtom);

  return (edgeType: string) => {
    setCustomizeEdgeType(edgeType);
  };
}

export function EdgeStyleDialog() {
  const [customizeEdgeType, setCustomizeEdgeType] = useAtom(
    customizeEdgeTypeAtom,
  );

  return (
    <Dialog
      open={Boolean(customizeEdgeType)}
      onOpenChange={open => !open && setCustomizeEdgeType(undefined)}
    >
      {customizeEdgeType ? <Content edgeType={customizeEdgeType} /> : null}
    </Dialog>
  );
}

function Content({ edgeType }: { edgeType: string }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  const t = useTranslations();

  const { edgeStyle, setEdgeStyle, resetEdgeStyle } = useEdgeStyling(edgeType);

  const selectOptions = (() => {
    const options = displayConfig.attributes.map(attr => ({
      value: attr.name,
      label: attr.displayLabel,
    }));

    options.unshift({
      label: t("edges-styling.edge-type"),
      value: RESERVED_TYPES_PROPERTY,
    });

    return options;
  })();

  return (
    <DialogContent className="max-w-2xl">
      <form>
        <DialogHeader>
          <DialogTitle>{t("edges-styling.title")}</DialogTitle>
          <DialogDescription>
            Customize styling for {displayConfig.displayLabel}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>Display Name Attribute</FieldLabel>
                <Select
                  value={edgeStyle.displayNameAttribute}
                  onValueChange={value =>
                    setEdgeStyle({ displayNameAttribute: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a display attribute" />
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
            <FieldSet>
              <FieldLegend>Label Styling</FieldLegend>
              <FieldGroup className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Background Color</FieldLabel>
                  <ColorPopover
                    color={edgeStyle.labelColor}
                    onColorChange={color => setEdgeStyle({ labelColor: color })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Background Opacity</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={edgeStyle.labelBackgroundOpacity}
                    onChange={e =>
                      setEdgeStyle({
                        labelBackgroundOpacity: parseNumberSafely(
                          e.target.value,
                        ),
                      })
                    }
                  />
                </Field>
              </FieldGroup>
              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel>Border Color</FieldLabel>
                  <ColorPopover
                    color={edgeStyle.labelBorderColor}
                    onColorChange={color =>
                      setEdgeStyle({ labelBorderColor: color })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Border Width</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={edgeStyle.labelBorderWidth}
                    onChange={e =>
                      setEdgeStyle({
                        labelBorderWidth: parseNumberSafely(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Border Style</FieldLabel>
                  <Select
                    value={edgeStyle.labelBorderStyle}
                    onValueChange={value =>
                      setEdgeStyle({ labelBorderStyle: value as LineStyle })
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
                    color={edgeStyle.lineColor}
                    onColorChange={color => setEdgeStyle({ lineColor: color })}
                  />
                </Field>

                <Field>
                  <FieldLabel>Line Thickness</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={edgeStyle.lineThickness}
                    onChange={e =>
                      setEdgeStyle({
                        lineThickness: parseNumberSafely(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Line Style</FieldLabel>
                  <Select
                    value={edgeStyle.lineStyle}
                    onValueChange={value =>
                      setEdgeStyle({ lineStyle: value as LineStyle })
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
                    value={edgeStyle.sourceArrowStyle}
                    onValueChange={value =>
                      setEdgeStyle({ sourceArrowStyle: value as ArrowStyle })
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
                    value={edgeStyle.targetArrowStyle}
                    onValueChange={value =>
                      setEdgeStyle({ targetArrowStyle: value as ArrowStyle })
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
          </FieldSet>
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          <Button type="button" color="danger" onClick={resetEdgeStyle}>
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
