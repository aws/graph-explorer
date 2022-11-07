import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const DashboardIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path fill="none" d="M0 0h24v24H0z" />
      <path
        fill="currentColor"
        d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
      />
    </IconBase>
  );
};

export default DashboardIcon;
