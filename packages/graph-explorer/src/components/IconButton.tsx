import { Button, type ButtonProps } from "./Button/Button";

export interface IconButtonProps extends ButtonProps {
  tooltipText?: string;
}

export function IconButton({
  tooltipText,
  size = "icon",
  children,
  ...props
}: IconButtonProps) {
  const iconSize: ButtonProps["size"] =
    size === "base"
      ? "icon"
      : size === "small"
        ? "icon-small"
        : size === "large"
          ? "icon-large"
          : size;

  return (
    <Button title={tooltipText} size={iconSize} {...props}>
      {children}
    </Button>
  );
}
