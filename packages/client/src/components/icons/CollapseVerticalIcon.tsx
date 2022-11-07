import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CollapseVerticalIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M8 18h3v4h2v-4h3l-4-4-4 4zm8-12h-3V2h-2v4H8l4 4 4-4zM5 11v2h14v-2H5z"
      />
    </IconBase>
  );
};

export default CollapseVerticalIcon;
