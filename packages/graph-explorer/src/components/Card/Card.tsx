import { cx } from "@emotion/css";
import type { ForwardedRef, HTMLAttributes, PropsWithChildren } from "react";
import { forwardRef } from "react";
import { useWithTheme } from "../../core";
import defaultStyles from "./Card.styles";

export interface CardProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "style"> {
  id?: string;
  className?: string;
  elevation?: 0 | 1 | 2 | 3 | 4;
  transparent?: boolean;
  /**
   * Allows to remove the default padding.
   */
  disablePadding?: boolean;
  onClick?: () => void;
}

export const Card = (
  {
    id,
    className,
    children,
    elevation = 1,
    disablePadding,
    transparent,
    onClick,
    ...restProps
  }: PropsWithChildren<CardProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const styleWithTheme = useWithTheme();
  return (
    <div
      id={id}
      onClick={onClick}
      ref={ref}
      className={cx(
        styleWithTheme(
          defaultStyles({
            elevation,
            disablePadding,
            transparent,
          })
        ),
        className,
        `card-elevation-${elevation}`,
        {
          ["card-clickable"]: !!onClick,
        }
      )}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<CardProps>>(Card);
