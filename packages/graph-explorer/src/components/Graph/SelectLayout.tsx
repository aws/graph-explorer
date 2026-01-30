import type { ComponentPropsWithRef } from "react";

import { type PrimitiveAtom, useAtom } from "jotai";

import type { LayoutName } from "@/components/Graph/helpers/layoutConfig";

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

export function SelectLayout({
  layoutAtom,
  ...props
}: ComponentPropsWithRef<typeof SelectTrigger> & {
  layoutAtom: PrimitiveAtom<LayoutName>;
}) {
  const [value, setValue] = useAtom(layoutAtom);

  return (
    <Select
      value={value}
      onValueChange={value => setValue(value as LayoutName)}
    >
      <SelectTrigger {...props}>
        <div className="flex flex-col items-start justify-center gap-0">
          <div className="text-text-secondary text-xs leading-none">Layout</div>
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
