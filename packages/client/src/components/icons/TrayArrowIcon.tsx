import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const TrayArrowIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default TrayArrowIcon;
