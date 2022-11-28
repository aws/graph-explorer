import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const SearchIcon = (props: IconBaseProps) => (
  <IconBase {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      stroke="currentColor"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </IconBase>
);

export default SearchIcon;
