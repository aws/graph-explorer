import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const LessThanIcon = (props: IconBaseProps) => {
  return (
    <IconBase
      {...props}
      style={{ transform: "rotate(180deg)", ...props.style }}
    >
      <path
        fill="currentColor"
        d="M20.1,9.8L5.7,3.1c-0.8-0.4-1.7,0-2,0.7L3,5.2C2.7,6,3,6.9,3.8,7.2L14.1,12L3.8,16.8c-0.8,0.4-1.1,1.2-0.7,2l0.6,1.4
		c0.4,0.8,1.2,1.1,2,0.7l14.4-6.7c0.5-0.2,0.9-0.8,0.9-1.4v-1.6C21,10.6,20.7,10.1,20.1,9.8z"
      />
    </IconBase>
  );
};

export default LessThanIcon;
