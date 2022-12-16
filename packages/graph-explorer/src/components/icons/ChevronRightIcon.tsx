import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const ChevronRightIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M7.41 6.09L13.32 12l-5.91 5.91L9 19.5l7.5-7.5L9 4.5 7.41 6.09z"
      />
    </IconBase>
  );
};

export default ChevronRightIcon;
