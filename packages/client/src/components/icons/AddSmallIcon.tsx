import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AddSmallIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12.8,16.8l-1.6,0l0-4.1l-4.1,0l0-1.6l4.1,0l0-4.1l1.6,0l0,4.1l4.1,0l0,1.6l-4.1,0L12.8,16.8z"
      />
    </IconBase>
  );
};

export default AddSmallIcon;
