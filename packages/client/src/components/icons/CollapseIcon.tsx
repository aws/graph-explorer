import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AccountIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M10 10H5V8H8V5H10V10Z" fill="currentColor" />
      <path d="M10 14H5V16H8V19H10V14Z" fill="currentColor" />
      <path d="M19 14H14V19H16V16H19V14Z" fill="currentColor" />
      <path d="M14 10H19V8H16V5H14V10Z" fill="currentColor" />
    </IconBase>
  );
};

export default AccountIcon;
