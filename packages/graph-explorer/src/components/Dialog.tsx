import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/utils";

import { Button } from "./Button/Button";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/15",
        className,
      )}
      {...props}
    />
  );
}
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center p-20">
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative flex max-h-full w-[500px] flex-col overflow-hidden rounded-lg shadow-2xl duration-200",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close asChild className="absolute top-5 right-5">
            <Button variant="ghost" size="icon-small" tooltip="Close">
              <XIcon />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
}
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * The dialog's title/description block, optionally preceded by a
 * {@link DialogMedia} tile. With no media it's a single stacked column; when a
 * media tile is present the header becomes a two-column grid — the tile spans
 * both rows on the left and the title/description flow into the right column,
 * mirroring {@link AlertDialogHeader}.
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-header"
    className={cn(
      "group/dialog-header grid gap-1.5 p-6 pb-3 has-data-[slot=dialog-media]:grid-cols-[auto_1fr] has-data-[slot=dialog-media]:grid-rows-[auto_1fr] has-data-[slot=dialog-media]:gap-x-4",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * An icon tile shown to the left of the dialog title. Give it a role tint via
 * `className` the same way {@link AlertDialogMedia} is used (e.g.
 * `bg-primary-subtle text-primary-foreground`); it spans both header rows so
 * the title and description sit beside it.
 */
const DialogMedia = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-media"
    className={cn(
      "bg-muted row-span-2 inline-flex size-10 items-center justify-center rounded-md *:[svg:not([class*='size-'])]:size-6",
      className,
    )}
    {...props}
  />
);
DialogMedia.displayName = "DialogMedia";

/**
 * The scrollable region of a dialog. Header and footer sit outside it and stay
 * fixed; only this body scrolls when its content overflows. `min-h-0` lets it
 * shrink below its content so `overflow-y-auto` engages inside the flex column.
 */
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6",
      className,
    )}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "bg-muted/50 flex flex-row justify-end gap-3 border-t p-6 max-sm:flex-col-reverse",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "gx-wrap-break-word text-lg leading-none font-semibold tracking-tight group-has-data-[slot=dialog-media]/dialog-header:col-start-2",
        className,
      )}
      {...props}
    />
  );
}
DialogTitle.displayName = DialogPrimitive.Title.displayName;

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-muted-foreground gx-wrap-break-word text-sm",
        className,
      )}
      {...props}
    />
  );
}
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogMedia,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
