import SVG from "react-inlinesvg";

export interface RemoteSvgIconProps {
  /**
   * The url of the svg
   */
  src: string;
}

/**
 * Fetches the remote SVG contents and renders it inline so that it honors any
 * css styling you've setup to affect the SVG (such as currentColor)
 */
export const RemoteSvgIcon = ({ src }: RemoteSvgIconProps) => {
  return <SVG src={src} style={{ width: "100%", height: "100%" }} />;
};

export default RemoteSvgIcon;
