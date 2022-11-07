import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const DockRightIcon = (props: IconBaseProps) => {
  return (
    <IconBase
      {...props}
      style={{ transform: "rotate(270deg)", ...props.style }}
    >
      <path
        d="M19 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3ZM19 5V15H5V5H19ZM5 19V17H19V19H5Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default DockRightIcon;
