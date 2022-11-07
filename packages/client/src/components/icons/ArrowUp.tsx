import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ArrowUp = (props: IconBaseProps) => {
  return (
    <IconBase
      {...props}
      style={{ transform: "rotate(180deg)", ...props.style }}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </IconBase>
  );
};

export default ArrowUp;
