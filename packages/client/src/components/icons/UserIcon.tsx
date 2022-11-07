import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const UserIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default UserIcon;
