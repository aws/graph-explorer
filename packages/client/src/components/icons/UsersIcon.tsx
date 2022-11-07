import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const UserIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.6699 13.13C18.0399 14.06 18.9999 15.32 18.9999 17V20H22.9999V17C22.9999 14.82 19.4299 13.53 16.6699 13.13Z"
        fill="currentColor"
      />
      <path
        d="M9 12C11.2091 12 13 10.2091 13 8C13 5.79086 11.2091 4 9 4C6.79086 4 5 5.79086 5 8C5 10.2091 6.79086 12 9 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.9999 12C17.2099 12 18.9999 10.21 18.9999 8C18.9999 5.79 17.2099 4 14.9999 4C14.5299 4 14.0899 4.1 13.6699 4.24C14.4999 5.27 14.9999 6.58 14.9999 8C14.9999 9.42 14.4999 10.73 13.6699 11.76C14.0899 11.9 14.5299 12 14.9999 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 13C6.33 13 1 14.34 1 17V20H17V17C17 14.34 11.67 13 9 13Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default UserIcon;
