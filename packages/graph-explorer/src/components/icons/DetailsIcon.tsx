import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const DetailsIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M3 18h18v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"
      />
    </IconBase>
  );
};

export default DetailsIcon;
