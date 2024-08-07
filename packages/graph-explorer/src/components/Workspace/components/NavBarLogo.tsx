import { cx } from "@emotion/css";
import type { ComponentProps } from "react";
import GraphExplorerIcon from "../../icons/GraphExplorerIcon";

export type NavBarLogoProps = Omit<ComponentProps<"div">, "children">;

export default function NavBarLogo({ className, ...rest }: NavBarLogoProps) {
  return (
    <div
      className={cx(
        "bg-logo-gradient mr-2 grid aspect-square h-full place-content-center overflow-hidden text-white",
        className
      )}
      {...rest}
    >
      <GraphExplorerIcon width={"2em"} height={"2em"} />
    </div>
  );
}
