import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const LessOrEqualThanIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props} style={{ transform: "scaleX(-1)", ...props.style }}>
      <path
        fill="currentColor"
        d="M5.1,6.1l7.1,2.8l-7.1,2.7c-0.7,0.2-1.1,1-0.9,1.7l0.5,1.2c0.3,0.7,1.1,1,1.8,0.8l12.2-4.8c0.6-0.2,0.9-0.7,0.9-1.2V8.6
	c0-0.5-0.4-1-0.9-1.2L6.6,2.5C5.9,2.2,5,2.6,4.8,3.3L4.3,4.5C4,5.1,4.4,5.9,5.1,6.1z M20,17.9H3.9c-0.5,0-1,0.4-1,1v1.9
	c0,0.5,0.4,1,1,1H20c0.5,0,1-0.4,1-1v-1.9C21,18.4,20.6,17.9,20,17.9z"
      />
    </IconBase>
  );
};

export default LessOrEqualThanIcon;
