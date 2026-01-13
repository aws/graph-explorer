import type { ComponentPropsWithRef, CSSProperties } from "react";

import { PencilIcon } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import {
  Button,
  inputStyles,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";
import { cn } from "@/utils";

export function ColorPopover({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <ColorSwatch color={color} />
          {color}
          <div className="flex-1" />
          <PencilIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="flex flex-col gap-4">
        <HexColorInput
          alpha
          color={color}
          onChange={onColorChange}
          className={cn(inputStyles())}
          autoFocus
        />
        <HexColorPicker
          onChange={onColorChange}
          color={color}
          className="block size-[200px] w-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

function ColorSwatch({
  color,
  className,
  ...props
}: ComponentPropsWithRef<"div"> & {
  color: Required<CSSProperties>["backgroundColor"];
}) {
  return (
    <div
      className={cn("size-5 shrink-0 rounded-full", className)}
      style={{
        backgroundColor: color,
      }}
      {...props}
    />
  );
}
