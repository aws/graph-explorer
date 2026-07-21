import type { ComponentProps } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
} from "@/components";
import { cn } from "@/utils";

/**
 * A selectable card wrapping one incoming style. The whole card is the
 * checkbox's label, so clicking anywhere toggles it, and the checkbox floats
 * over the card's top-left corner. Compose the preview, title, and details
 * inside as children.
 */
export function ImportCard({
  label,
  checked,
  onCheckedChange,
  className,
  children,
  ...props
}: ComponentProps<"label"> & {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className={cn("block h-full cursor-pointer", className)} {...props}>
      <Card
        className={cn(
          "relative h-full pt-0 transition",
          checked ? "border-primary ring-primary ring-2" : "saturate-0",
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="absolute top-(--card-spacing) left-(--card-spacing) z-10"
          aria-label={`Load ${label} style`}
        />
        {children}
      </Card>
    </label>
  );
}

/**
 * The canvas-tinted region a style preview floats on, bleeding to the card
 * edges. Left-padded to clear the floating checkbox.
 */
export function ImportCardSurface({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-workspace-canvas px-[calc(var(--card-spacing)+(--spacing(4)))] py-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

/** The monospace type-name header for a style card. */
export function ImportCardTitle({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <CardHeader>
      <CardTitle
        className={cn(
          "gx-wrap-break-word font-mono text-sm font-normal",
          className,
        )}
        {...props}
      />
    </CardHeader>
  );
}

/** A definition list of a style's extra settings, beneath the title. */
export function ImportCardDetails({
  className,
  ...props
}: ComponentProps<"dl">) {
  return (
    <CardContent>
      <dl
        className={cn(
          "text-muted-foreground space-y-3 border-t pt-4 text-sm",
          className,
        )}
        {...props}
      />
    </CardContent>
  );
}

/** One label/value row inside {@link ImportCardDetails}. */
export function ImportCardDetailItem({
  label,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { label: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-between gap-2 leading-snug",
        className,
      )}
      {...props}
    >
      <dt>{label}</dt>
      <dd className="gx-wrap-break-word text-foreground font-mono leading-snug">
        {children}
      </dd>
    </div>
  );
}
