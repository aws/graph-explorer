import type { PropsWithChildren, SVGAttributes } from "react";

export interface IconBaseProps
  extends Omit<SVGAttributes<SVGElement>, "fill" | "stroke"> {
  className?: string;
  color?: string;
}

export const IconBase = ({
  className,
  color,
  children,
  style,
  ...attrs
}: PropsWithChildren<IconBaseProps>) => {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color: color }}
      {...attrs}
    >
      {children}
    </svg>
  );
};

export default IconBase;
