import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const PinIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 9V4H17C17.55 4 18 3.55 18 3C18 2.45 17.55 2 17 2H7C6.45 2 6 2.45 6 3C6 3.55 6.45 4 7 4H8V9C8 10.66 6.66 12 5 12V14H10.97V21L11.97 22L12.97 21V14H19V12C17.34 12 16 10.66 16 9Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default PinIcon;
