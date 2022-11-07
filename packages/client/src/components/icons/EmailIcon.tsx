import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const EmailIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M20 5H4C2.9 5 2.01 5.9 2.01 7L2 17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V7C22 5.9 21.1 5 20 5ZM20 9L12 14L4 9V7L12 12L20 7V9Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default EmailIcon;
