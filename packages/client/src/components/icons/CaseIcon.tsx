import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CaseIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 7H20C21.1 7 22 7.9 22 9V11H2V9C2 7.9 2.9 7 4 7H8V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7ZM14 5H10V7H14V5Z"
        fill="currentColor"
      />
      <path
        d="M2 19V13H10V15H14V13H22V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default CaseIcon;
