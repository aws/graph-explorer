import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ExpandIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M8 6h3v4h2V6h3l-4-4-4 4zm8 12h-3v-4h-2v4H8l4 4 4-4zM5 11v2h14v-2H5z"
      />
    </IconBase>
  );
};

export default ExpandIcon;
