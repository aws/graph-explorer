import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SunIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="m12 6 1 2h-2l1-2zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM8 11l-2 1 2 1v-2zM18 12l-2 1v-2l2 1zM11 16l1 2 1-2h-2zM7.757 7.758l2.122.707-1.415 1.414-.707-2.121zM8.464 14.12l-.707 2.122 2.122-.707-1.415-1.414zM16.243 7.758l-.707 2.121-1.415-1.414 2.122-.707zM14.121 15.535l2.122.707-.707-2.121-1.415 1.414z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default SunIcon;
