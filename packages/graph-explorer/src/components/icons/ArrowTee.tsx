import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowTee = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 11L18.875 11V13L1 13L1 11Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.5 18.5V6L19.5 6V18.5H18.5Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ArrowTee;
