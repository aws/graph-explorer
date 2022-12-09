import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowDiamond = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 11L18.875 11V13L1 13L1 11Z"
        fill="currentColor"
      />
      <path
        d="M15 6.34314L20.6569 12L15 17.6568L9.34315 12L15 6.34314Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ArrowDiamond;
