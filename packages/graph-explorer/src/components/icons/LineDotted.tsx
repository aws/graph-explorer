import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const LineDotted = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 13H3V11H5V13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 13H7V11H9V13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 13H11V11H13V13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 13H15V11H17V13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 13H19V11H21V13Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default LineDotted;
