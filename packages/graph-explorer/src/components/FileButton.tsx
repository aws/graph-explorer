import * as React from "react";
import { Slot } from "radix-ui";
import { Button } from "./Button";

type FilesProps =
  | {
      multiple: true;
      onChange?: (files: FileList | null) => void;
    }
  | {
      multiple?: false;
      onChange?: (file: File | null) => void;
    };

type ButtonProps = Omit<
  React.ComponentPropsWithRef<typeof Button>,
  "onChange" | "onClick" | "onPress" | "onActionClick"
>;

export type FileButtonHandle = {
  reset: () => void;
};

export type FileButtonProps = {
  resetRef?: React.RefObject<FileButtonHandle | null>;
  asChild?: boolean;
  accept?: string;
} & ButtonProps &
  FilesProps;

/**
 * A wrapper around whatever button you want to open a file dialog. It will
 * automatically open the file dialog when clicked.
 *
 * @example
 * <FileButton onChange={files => console.log(files)} asChild>
 *   <Button>Open File</Button>
 * </FileButton>
 */
export const FileButton = ({
  asChild,
  resetRef,
  onChange,
  accept,
  multiple,
  disabled,
  children,
  ...props
}: FileButtonProps) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    !disabled && inputRef.current?.click();
  };

  // Calls onChange with the selected file or files
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (multiple) {
      onChange?.(files);
    } else {
      const file = files?.[0] ?? null;
      onChange?.(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = "";
  };

  // Provides a way for the consumer to reset the input value
  React.useImperativeHandle(resetRef, () => ({
    reset: () => {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
  }));

  // Use the child as the component, or fall back to a button
  const Component = asChild ? (Slot as any) : Button;

  return (
    <>
      <Component
        type="button"
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Component>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-hidden
      />
    </>
  );
};

FileButton.displayName = "FileButton";
