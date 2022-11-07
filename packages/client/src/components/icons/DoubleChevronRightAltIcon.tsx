import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const DoubleChevronRightAltIcon = (props: IconBaseProps) => {
  return (
    <IconBase
      {...props}
      style={{ transform: "rotate(180deg)", ...props.style }}
    >
      <path
        fill="currentColor"
        d="M11 6L12.41 7.41L7.83 12L12.41 16.59L11 18L5 12L11 6Z"
      />
      <path
        fill="currentColor"
        d="M17 6L18.41 7.41L13.83 12L18.41 16.59L17 18L11 12L17 6Z"
      />
    </IconBase>
  );
};

export default DoubleChevronRightAltIcon;
