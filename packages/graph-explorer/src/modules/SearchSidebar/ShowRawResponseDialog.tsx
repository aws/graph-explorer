import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components";
import { cn } from "@/utils";
import { ClipboardCheckIcon, ClipboardIcon } from "lucide-react";
import { useState, type ComponentPropsWithoutRef } from "react";

export function ShowRawResponseDialogButton({
  rawResponse,
  className,
  ...props
}: { rawResponse: unknown } & ComponentPropsWithoutRef<typeof Button>) {
  const rawResponseText = JSON.stringify(rawResponse, null, 2);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={cn("shrink-0 rounded-full", className)} {...props}>
          Raw Response
        </Button>
      </DialogTrigger>
      <DialogContent className="flex w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Raw Query Response</DialogTitle>
          <DialogDescription>
            The raw response from the database query
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grow overflow-auto">
          <pre className="bg-muted overflow-auto rounded-lg border p-4 text-sm">
            <code>{rawResponseText}</code>
          </pre>
        </DialogBody>
        <DialogFooter className="justify-between">
          <CopyToClipboardButton text={rawResponseText} />
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CopyToClipboardButton({
  text,
  className,
  ...props
}: { text: string } & ComponentPropsWithoutRef<typeof Button>) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <Button onClick={copyToClipboard} className={cn("", className)} {...props}>
      {copied ? <ClipboardCheckIcon /> : <ClipboardIcon />}
      {copied ? "Copied!" : "Copy to Clipboard"}
    </Button>
  );
}
