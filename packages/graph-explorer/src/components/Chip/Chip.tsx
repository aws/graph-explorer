import { cx } from "@emotion/css";
import type {
  ForwardedRef,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";
import { forwardRef } from "react";
import { useWithTheme } from "@/core";
import IconButton from "../IconButton";
import CloseIcon from "@/components/icons/CloseIcon";
import defaultStyles from "./Chip.styles";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  /* Takes precedence over variants and theme*/
  color?: string;
  /* Takes precedence over variants and theme*/
  background?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  deleteIcon?: ReactNode;
  onDelete?(): void;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "info" | "success" | "error" | "warning";
}

export const Chip = (
  {
    children,
    className,
    color,
    background,
    size = "sm",
    variant = "info",
    startAdornment,
    endAdornment,
    onDelete,
    deleteIcon,
    ...allProps
  }: PropsWithChildren<ChipProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const styleWithTheme = useWithTheme();

  return (
    <div
      ref={ref}
      className={cx(
        styleWithTheme(defaultStyles(variant, background, color, size)),
        "chip",
        {
          ["chip-clickable"]: !!allProps.onClick,
          ["chip-deletable"]: !!onDelete,
        },
        className
      )}
      {...allProps}
    >
      {startAdornment}
      <span className={"chip-label"}>{children}</span>
      {endAdornment}
      {onDelete && (
        <IconButton
          rounded
          onPress={onDelete}
          className={"icon-delete"}
          icon={deleteIcon || <CloseIcon />}
          variant="text"
          size="small"
        />
      )}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<ChipProps>>(Chip);
