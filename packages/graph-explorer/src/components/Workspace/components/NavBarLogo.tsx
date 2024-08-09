import { cx } from "@emotion/css";
import GraphExplorerIcon from "../../icons/GraphExplorerIcon";
import { ComponentBaseProps } from "../..";

export default function NavBarLogo({ className, ...rest }: ComponentBaseProps) {
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
