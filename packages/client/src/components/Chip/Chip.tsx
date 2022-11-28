import { cx } from "@emotion/css";
import type {
  ForwardedRef,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";
import { forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import IconButton from "../IconButton";
import CloseIcon from "../icons/CloseIcon";
import defaultStyles from "./Chip.styles";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  classNamePrefix?: string;
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
    classNamePrefix = "ft",
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
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      ref={ref}
      className={cx(
        styleWithTheme(
          defaultStyles(variant, background, color, size, classNamePrefix)
        ),
        pfx("chip"),
        {
          [pfx("chip-clickable")]: !!allProps.onClick,
          [pfx("chip-deletable")]: !!onDelete,
        },
        className
      )}
      {...allProps}
    >
      {startAdornment}
      <span className={pfx("chip-label")}>{children}</span>
      {endAdornment}
      {onDelete && (
        <IconButton
          rounded
          onPress={onDelete}
          className={pfx("icon-delete")}
          icon={deleteIcon || <CloseIcon />}
          variant="text"
          size="small"
        />
      )}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<ChipProps>>(Chip);
