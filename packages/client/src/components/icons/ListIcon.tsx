import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ListIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M3 13.959H7V9.95898H3V13.959ZM3 18.959H7V14.959H3V18.959ZM3 8.95898H7V4.95898H3V8.95898ZM8 13.959H21V9.95898H8V13.959ZM8 18.959H21V14.959H8V18.959ZM8 4.95898V8.95898H21V4.95898H8Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ListIcon;
