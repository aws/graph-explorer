import { PencilIcon } from "lucide-react";
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  useEffect,
  useState,
} from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import {
  Button,
  inputStyles,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";
import { useDebounceValue, usePrevious } from "@/hooks";
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
        <ColorPicker color={color} onColorChange={onColorChange} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Tracks the pointer locally and commits on a delay, following the same pattern
 * as the display-name field in `modules/Styles/VertexStyleRow.tsx`.
 *
 * `react-colorful` fires `onChange` on every pointermove, and each committed
 * style rebuilds every element's data and re-serializes the whole canvas — one
 * dropped frame per commit, measured up to ~200ms on a 76 node graph. Local
 * state keeps the swatch following the pointer at full rate regardless.
 *
 * Separate from `ColorPopover` so it mounts with the popover content, which
 * Radix unmounts on close: the draft is therefore seeded from `color` on every
 * open and cannot drift across openings.
 */
function ColorPicker({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  const [draft, setDraft] = useState(color);
  const debouncedDraft = useDebounceValue(draft, 150);
  const previousDraft = usePrevious(debouncedDraft);

  useEffect(() => {
    if (previousDraft === null || previousDraft === debouncedDraft) {
      return;
    }
    onColorChange(debouncedDraft);
  }, [debouncedDraft, previousDraft, onColorChange]);

  return (
    <>
      <HexColorInput
        alpha
        color={draft}
        onChange={setDraft}
        className={cn(inputStyles())}
        autoFocus
      />
      <HexColorPicker
        onChange={setDraft}
        color={draft}
        className="block size-[200px] w-auto"
      />
    </>
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
