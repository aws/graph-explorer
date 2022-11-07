import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const CommentsIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"
      />
    </IconBase>
  );
};

export default CommentsIcon;
