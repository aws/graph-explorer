import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const DroleftIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        transform="rotate(90,12,12)"
        d="M12 15l4-5H8l4 5z"
      />
    </IconBase>
  );
};

export default DroleftIcon;
