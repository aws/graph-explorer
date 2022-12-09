import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CloseIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M17.922 16.308L16.237 18l-4.289-4.308L7.658 18l-1.684-1.692L10.264 12l-4.29-4.308L7.659 6l4.29 4.308L16.236 6l1.685 1.692L13.632 12l4.29 4.308z"
      />
    </IconBase>
  );
};

export default CloseIcon;
