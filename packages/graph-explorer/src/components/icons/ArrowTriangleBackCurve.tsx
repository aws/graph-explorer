import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowTriangleBackCurve = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M23 12.1667L11.75 18.6618C11.75 18.6618 15.5 14.5 15.5 12C15.5 9.5 11.75 5.67146 11.75 5.67146L23 12.1667Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 11L18.875 11V13L1 13L1 11Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ArrowTriangleBackCurve;
