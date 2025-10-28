import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components";
import type { LayoutName } from "@/components/Graph/helpers/layoutConfig";
import { cn } from "@/utils";
import { atom, useAtom } from "jotai";
import type { ComponentPropsWithRef } from "react";

export const graphLayoutSelectionAtom = atom<LayoutName>("F_COSE");

export function SelectLayout({
  className,
  ...selectTriggerProps
}: ComponentPropsWithRef<typeof SelectTrigger>) {
  const [value, setValue] = useAtom(graphLayoutSelectionAtom);

  return (
    <Select
      value={value}
      onValueChange={value => setValue(value as LayoutName)}
    >
      <SelectTrigger
        className={cn("h-11 py-1", className)}
        {...selectTriggerProps}
      >
        <div className="flex flex-col items-start justify-center gap-0">
          <div className="text-xs leading-none text-text-secondary">Layout</div>
          <SelectValue placeholder="Select a layout" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="F_COSE">Force Directed (F0Cose)</SelectItem>
        <SelectItem value="D3">Force Directed (D3)</SelectItem>
        <SelectItem value="CONCENTRIC">Concentric</SelectItem>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Klay</SelectLabel>
          <SelectItem value="KLAY_LR">Klay (Left to Right)</SelectItem>
          <SelectItem value="KLAY_TB">Klay (Top to Bottom)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Hierarchical</SelectLabel>
          <SelectItem value="DAGRE_LR">Hierarchical (Left to Right)</SelectItem>
          <SelectItem value="DAGRE_RL">Hierarchical (Right to Left)</SelectItem>
          <SelectItem value="DAGRE_TB">Hierarchical (Top to Bottom)</SelectItem>
          <SelectItem value="DAGRE_BT">Hierarchical (Bottom to Top)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Subway</SelectLabel>
          <SelectItem value="SUBWAY_LR">Subway (Left to Right)</SelectItem>
          <SelectItem value="SUBWAY_RL">Subway (Right to Left)</SelectItem>
          <SelectItem value="SUBWAY_TB">Subway (Top to Bottom)</SelectItem>
          <SelectItem value="SUBWAY_BT">Subway (Bottom to Top)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
