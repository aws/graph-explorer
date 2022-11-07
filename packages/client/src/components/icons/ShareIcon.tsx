import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ShareIcon = (props: IconBaseProps) => {
  return (
    <IconBase
      {...props}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        stroke="currentColor"
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
      ></path>
      <polyline stroke="currentColor" points="16 6 12 2 8 6"></polyline>
      <line stroke="currentColor" x1="12" y1="2" x2="12" y2="15"></line>
    </IconBase>
  );
};

export default ShareIcon;
