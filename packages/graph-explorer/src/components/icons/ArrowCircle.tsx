import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowCircle = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 11L18.875 11V13L1 13L1 11Z"
        fill="currentColor"
      />
      <path
        d="M19 12C19 15.3137 16.3137 18 13 18C9.6863 18 7.00001 15.3137 7.00001 12C7.00001 8.68629 9.6863 6 13 6C16.3137 6 19 8.68629 19 12Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ArrowCircle;
