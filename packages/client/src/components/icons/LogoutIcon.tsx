import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const LogoutIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M13 3H11V13H13V3ZM17.83 5.17L16.41 6.59C17.99 7.86 19 9.81 19 12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12C5 9.81 6.01 7.86 7.58 6.58L6.17 5.17C4.23 6.82 3 9.26 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 9.26 19.77 6.82 17.83 5.17Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default LogoutIcon;
