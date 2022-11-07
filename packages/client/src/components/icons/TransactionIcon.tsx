import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const TransactionIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M18 17H6V15H18V17ZM18 13H6V11H18V13ZM18 9H6V7H18V9ZM3 22L4.5 20.5L6 22L7.5 20.5L9 22L10.5 20.5L12 22L13.5 20.5L15 22L16.5 20.5L18 22L19.5 20.5L21 22V2L19.5 3.5L18 2L16.5 3.5L15 2L13.5 3.5L12 2L10.5 3.5L9 2L7.5 3.5L6 2L4.5 3.5L3 2V22Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default TransactionIcon;
