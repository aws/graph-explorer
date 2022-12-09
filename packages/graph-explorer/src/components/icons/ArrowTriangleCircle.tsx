import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowTriangleCircle = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M11.5 12L1.25 18.6618L1.25 5.67146L11.5 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.5 11L21 11V13L0.5 13V11Z"
        fill="currentColor"
      />
      <path
        d="M23.5 12C23.5 15.3137 20.8137 18 17.5 18C14.1863 18 11.5 15.3137 11.5 12C11.5 8.68629 14.1863 6 17.5 6C20.8137 6 23.5 8.68629 23.5 12Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ArrowTriangleCircle;
