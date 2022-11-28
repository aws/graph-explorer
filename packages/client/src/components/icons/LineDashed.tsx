import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const LineDashed = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 13H1V11H7V13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 13H9V11H15V13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 13H17V11H23V13Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default LineDashed;
