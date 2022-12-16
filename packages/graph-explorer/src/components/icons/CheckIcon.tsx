import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CheckIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12,2.2c-5.4,0-9.7,4.4-9.7,9.7s4.4,9.7,9.7,9.7s9.7-4.4,9.7-9.7S17.3,2.2,12,2.2z M10.5,16.5L6,12l1.7-1.7
			l2.8,2.8l5.8-5.8L18,8.9L10.5,16.5z"
      />
    </IconBase>
  );
};

export default CheckIcon;
