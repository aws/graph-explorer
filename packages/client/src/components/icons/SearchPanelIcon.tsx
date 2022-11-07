import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SearchPanelIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M16 8H4v2h12V8zM16 4H4v2h12V4zM11 12H4v2h7v-2z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M20 15c0 .74-.21 1.43-.57 2.02L22 19.59 20.59 21l-2.57-2.57c-.59.35-1.28.57-2.02.57-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4zm-6 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"
        clipRule="evenodd"
      />
    </IconBase>
  );
};

export default SearchPanelIcon;
