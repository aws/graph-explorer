import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const PolygonSelectionIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M5.17582 6.16484L3 12.3626L4.51648 17.6374L6.0989 20.3407L9.65934 21L15.7912 19.0879L21 13.5824L20.8022 8.53846L17.4396 3L5.17582 6.16484Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <circle cx="6.13005" cy="6.91301" r="2.34783" fill="currentColor" />
    </IconBase>
  );
};

export default PolygonSelectionIcon;
