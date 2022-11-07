import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const ExpandFilterIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M9 5H5V9H3V5C3 3.9 3.9 3 5 3H9V5Z" fill="currentColor" />
      <path d="M3 15H5V19H9V21H5C3.9 21 3 20.1 3 19V15Z" fill="currentColor" />
      <path d="M19 3H15V5H19V9H21V5C21 3.9 20.1 3 19 3Z" fill="currentColor" />
      <path
        d="M15 19H19V15H21V19C21 20.1 20.1 21 19 21H15V19Z"
        fill="currentColor"
      />
      <path
        d="M7.51661 7.77687C7.29562 7.44455 7.53387 7 7.93296 7H16.0657C16.4651 7 16.7033 7.44507 16.4818 7.77735L13 13L13.0167 17.1927C13.0182 17.564 12.6288 17.8073 12.2958 17.6433L11.269 17.1375C11.0982 17.0533 10.99 16.8794 10.99 16.6889V13L7.51661 7.77687Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ExpandFilterIcon;
