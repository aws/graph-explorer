import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AddIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <g>
        <rect fill="none" height="24" width="24" />
      </g>
      <g>
        <g>
          <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z" fill="currentColor" />
        </g>
      </g>
    </IconBase>
  );
};

export default AddIcon;
