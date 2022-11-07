import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const InfoIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 4c-4.416 0-8 3.584-8 8s3.584 8 8 8 8-3.584 8-8-3.584-8-8-8zm1 12h-2v-5h2v5zm0-6h-2V8h2v2z"
      />
    </IconBase>
  );
};

export default InfoIcon;
