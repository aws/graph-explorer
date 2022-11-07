import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CaptionIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M19.2 5H4.8C3.81 5 3 5.81 3 6.8V17.6C3 18.59 3.81 19.4 4.8 19.4H19.2C20.19 19.4 21 18.59 21 17.6V6.8C21 5.81 20.19 5 19.2 5ZM4.8 12.2H8.4V14H4.8V12.2ZM13.8 17.6H4.8V15.8H13.8V17.6ZM19.2 17.6H15.6V15.8H19.2V17.6ZM19.2 14H10.2V12.2H19.2V14Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default CaptionIcon;
