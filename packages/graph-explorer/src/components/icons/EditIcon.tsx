import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const EditIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <g>
        <rect fill="none" height="24" width="24" />
      </g>
      <g>
        <g>
          <g>
            <polygon
              points="3,17.25 3,21 6.75,21 17.81,9.94 14.06,6.19"
              fill="currentColor"
            />
          </g>
          <g>
            <path
              d="M20.71,5.63l-2.34-2.34c-0.39-0.39-1.02-0.39-1.41,0l-1.83,1.83l3.75,3.75l1.83-1.83C21.1,6.65,21.1,6.02,20.71,5.63z"
              fill="currentColor"
            />
          </g>
        </g>
      </g>
    </IconBase>
  );
};

export default EditIcon;
