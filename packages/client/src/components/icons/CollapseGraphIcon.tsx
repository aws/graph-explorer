import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CollapseGraphIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm6-6h-2v4c0 1.1.9 2 2
        2h4V6h-4V2zm0 16h4v-2h-4c-1.1 0-2 .9-2 2v4h2v-4zM6 16H2v2h4v4h2v-4c0-1.1-.9-2-2-2zM6
        6H2v2h4c1.1 0 2-.9 2-2V2H6v4z"
      />
    </IconBase>
  );
};

export default CollapseGraphIcon;
