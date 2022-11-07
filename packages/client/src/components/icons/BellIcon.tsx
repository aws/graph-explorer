import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const BellIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.89 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default BellIcon;
