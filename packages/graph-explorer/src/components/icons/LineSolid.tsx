import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const LineSolid = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 13H2V11H22V13Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default LineSolid;
