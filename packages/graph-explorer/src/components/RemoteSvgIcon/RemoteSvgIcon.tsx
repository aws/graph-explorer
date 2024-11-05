import { cn } from "@/utils";
import SVG, { Props } from "react-inlinesvg";

export type RemoteSvgIconProps = Pick<Props, "src" | "className">;

/**
 * Fetches the remote SVG contents and renders it inline so that it honors any
 * css styling you've setup to affect the SVG (such as currentColor)
 */
export default function RemoteSvgIcon({ src, className }: RemoteSvgIconProps) {
  return <SVG src={src} className={cn("size-full", className)} />;
}
