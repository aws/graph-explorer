import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ErrorIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M5 17h14L12 5 5 17zm8-1h-2v-2h2v2zm0-3h-2V9h2v4z"
      />
    </IconBase>
  );
};

export default ErrorIcon;
