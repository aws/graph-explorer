import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ClipboardIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M17.3337 9.66634V8.33301H6.66699V9.66634H17.3337Z"
        fill="currentColor"
      />
      <path
        d="M6.66699 13.0003V11.667H17.3337V13.0003H6.66699Z"
        fill="currentColor"
      />
      <path d="M17.3337 15V16.3333H6.66699V15H17.3337Z" fill="currentColor" />
      <path
        d="M6.66699 18.333H14.667V19.6663H6.66699V18.333Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1C13.1046 1 14 1.89543 14 3H18.6667C19.4031 3 20 3.59694 20 4.33333V21.6667C20 22.403 19.403 23 18.6667 23H5.33333C4.59694 23 4 22.403 4 21.6667V4.33333C4 3.59694 4.59694 3 5.33333 3H10C10 1.89543 10.8954 1 12 1ZM16 3.66667H18.6667C19.0349 3.66667 19.3333 3.96515 19.3333 4.33333V21.6667C19.3333 22.0349 19.0349 22.3333 18.6667 22.3333H5.33333C4.96515 22.3333 4.66667 22.0349 4.66667 21.6667V4.33333C4.66667 3.96515 4.96515 3.66667 5.33333 3.66667H8V5.66667H16V3.66667ZM12 3.66667C12.3682 3.66667 12.6667 3.36818 12.6667 3C12.6667 2.63182 12.3682 2.33333 12 2.33333C11.6318 2.33333 11.3333 2.63182 11.3333 3C11.3333 3.36818 11.6318 3.66667 12 3.66667Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ClipboardIcon;
