import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const DoubleChevronRightIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M2.6,5.9L8.7,12l-6.1,6.1l1.6,1.6L12,12L4.3,4.3L2.6,5.9z"
      />
      <path
        fill="currentColor"
        d="M12,5.9l6.1,6.1L12,18.1l1.6,1.6l7.7-7.7l-7.7-7.7L12,5.9z"
      />
    </IconBase>
  );
};

export default DoubleChevronRightIcon;
