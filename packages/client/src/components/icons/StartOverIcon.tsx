import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const StartOverIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path fill="currentColor" d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </IconBase>
  );
};

export default StartOverIcon;
