import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Button } from "./Button";

export interface FileButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Button>, "onChange"> {
  asChild?: boolean;
  onChange?: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
}

/**
 * A wrapper around whatever button you want to open a file dialog. It will
 * automatically open the file dialog when clicked.
 *
 * @example
 * <FileButton onChange={files => console.log(files)} asChild>
 *   <Button>Open File</Button>
 * </FileButton>
 */
export const FileButton = React.forwardRef<HTMLButtonElement, FileButtonProps>(
  (
    { asChild, onChange, accept, multiple, isDisabled, children, ...props },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleClick = () => {
      !isDisabled && inputRef.current?.click();
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      onChange?.(files);
      // Reset the input value to allow selecting the same file again
      event.target.value = "";
    };

    const Component = asChild ? (Slot as any) : Button;

    return (
      <>
        <Component ref={ref} type="button" onClick={handleClick} {...props}>
          {children}
        </Component>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={isDisabled}
          className="hidden"
          aria-hidden
        />
      </>
    );
  }
);

FileButton.displayName = "FileButton";
