import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CodeIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m4.594 12.429 4.732 4.928-1.44 1.5-6.172-6.428L7.886 6l1.44 1.5-4.732 4.929zm14.812 0-4.732 4.928 1.44 1.5 6.172-6.428L16.114 6l-1.44 1.5 4.732 4.929z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default CodeIcon;
