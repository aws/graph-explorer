import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const StarIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props} viewBox={"0 0 24 24"}>
      <path
        d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default StarIcon;
