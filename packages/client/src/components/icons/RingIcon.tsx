import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const RingIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <circle
        cx="12.0746"
        cy="12.3331"
        r="8.34443"
        stroke="currentColor"
        strokeWidth="1.44446"
      />
      <circle cx="11.8225" cy="3.64444" r="2.64444" fill="currentColor" />
      <circle cx="11.8225" cy="21.022" r="2.64444" fill="currentColor" />
      <circle cx="4.77079" cy="8.05175" r="2.64444" fill="currentColor" />
      <circle cx="19.0004" cy="16.8664" r="2.64444" fill="currentColor" />
      <circle cx="4.64444" cy="16.8664" r="2.64444" fill="currentColor" />
      <circle cx="19.7555" cy="8.05175" r="2.64444" fill="currentColor" />
    </IconBase>
  );
};

export default RingIcon;
