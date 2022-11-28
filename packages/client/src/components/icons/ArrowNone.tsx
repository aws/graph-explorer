import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowNone = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 11L18.875 11V13L1 13L1 11Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ArrowNone;
