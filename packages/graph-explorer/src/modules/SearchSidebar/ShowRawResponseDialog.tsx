import {
  Button,
  CodeEditor,
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
      <DialogContent className="grid h-full w-5xl grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>Raw Query Response</DialogTitle>
          <DialogDescription>
            The raw response from the database query
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid min-h-0 py-3">
          <div className="overflow-auto rounded-lg border bg-gray-50 shadow-xs">
            <CodeEditor
              defaultLanguage="json"
              value={rawResponseText}
              options={{
                readOnly: true,
                ariaLabel: "Raw Query Response",
                // Matches current tailwind padding of 2 or 0.5rem
                padding: { top: 7, bottom: 7 },
              }}
              wrapperProps={{ className: "pl-2" }}
            />
          </div>
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
