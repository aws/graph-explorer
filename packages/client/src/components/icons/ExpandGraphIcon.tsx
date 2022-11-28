import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const ExpandGraphIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M5 15H3L3 19C3 20.1 3.9 21 5 21H9V19H5L5 15Z"
        fill="currentColor"
      />
      <path d="M5 5L9 5V3L5 3C3.9 3 3 3.9 3 5L3 9H5L5 5Z" fill="currentColor" />
      <path
        d="M19 3L15 3V5L19 5V9H21V5C21 3.9 20.1 3 19 3Z"
        fill="currentColor"
      />
      <path
        d="M19 19H15L15 21H19C20.1 21 21 20.1 21 19V15L19 15V19Z"
        fill="currentColor"
      />
      <path
        d="M16 9C16 10.1046 15.1046 11 14 11C13.5001 11 13.043 10.8166 12.6924 10.5134L10.951 11.5582C10.9831 11.7004 11 11.8482 11 12C11 12.1518 10.9831 12.2997 10.951 12.4418L12.6924 13.4866C13.043 13.1834 13.5001 13 14 13C15.1046 13 16 13.8954 16 15C16 16.1046 15.1046 17 14 17C12.8954 17 12 16.1046 12 15C12 14.8482 12.0169 14.7004 12.0489 14.5583L10.3075 13.5135C9.95691 13.8166 9.49987 14 9 14C7.89543 14 7 13.1046 7 12C7 10.8954 7.89543 10 9 10C9.4999 10 9.95696 10.1834 10.3076 10.4866L12.049 9.44177C12.0169 9.29965 12 9.1518 12 9C12 7.89543 12.8954 7 14 7C15.1046 7 16 7.89543 16 9Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ExpandGraphIcon;
