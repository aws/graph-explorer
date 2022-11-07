import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ClearCanvasIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2.24 5.07l-1.2-1.2 1.41-1.42 19.09 19.1-1.41 1.41L17.17 20H4c-1.1 0-2-.9-2-2V6c0-.34.09-.65.24-.93zM8 14v-2H4v2h4zm6 4v-1.17l-.83-.83H4v2h10zM6.83 4H20c1.1 0 2 .9 2 2v12c0 .34-.09.65-.24.93L16.83 14H20v-2h-5.17l-8-8z"
        clipRule="evenodd"
      />
    </IconBase>
  );
};

export default ClearCanvasIcon;
