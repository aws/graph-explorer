import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const TrayArrowIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <g clipPath="url(#clip0_132_3909)">
        <path
          d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z"
          fill="#484848"
        />
      </g>
      <defs>
        <clipPath id="clip0_132_3909">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </IconBase>
  );
};

export default TrayArrowIcon;
