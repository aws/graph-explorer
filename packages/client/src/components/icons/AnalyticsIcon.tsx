import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AnalyticsIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <g>
        <rect fill="none" height="24" width="24" />
        <g>
          <path
            fill="currentColor"
            d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"
          />
          <rect fill="currentColor" height="5" width="2" x="7" y="12" />
          <rect fill="currentColor" height="10" width="2" x="15" y="7" />
          <rect fill="currentColor" height="3" width="2" x="11" y="14" />
          <rect fill="currentColor" height="2" width="2" x="11" y="10" />
        </g>
      </g>
    </IconBase>
  );
};

export default AnalyticsIcon;
