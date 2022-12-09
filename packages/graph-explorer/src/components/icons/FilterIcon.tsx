import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const FilterIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M5.25 5.66c.1.13 4.74 7.33 4.74 7.33V19c0 .55.45 1 1.01 1h2.01c.55 0 1.01-.45 1.01-1v-6.02s4.49-7.02 4.75-7.34C19.03 5.32 19 5 19 5c0-.55-.45-1-1.01-1H6.01C5.4 4 5 4.48 5 5c0 .2.06.44.25.66z"
      />
    </IconBase>
  );
};

export default FilterIcon;
