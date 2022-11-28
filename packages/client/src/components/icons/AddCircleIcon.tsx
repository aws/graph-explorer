import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AddCircleIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default AddCircleIcon;
