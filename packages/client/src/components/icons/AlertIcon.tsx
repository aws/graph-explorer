import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AlertIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M19.1994 16.2V10.2C19.1994 6.516 17.2314 3.43199 13.7994 2.61599V1.8C13.7994 0.804 12.9954 0 11.9994 0C11.0034 0 10.1994 0.804 10.1994 1.8V2.61599C6.75541 3.43199 4.79941 6.504 4.79941 10.2V16.2L2.39941 18.6V19.8H21.5994V18.6L19.1994 16.2ZM13.1994 16.2H10.7994V13.8H13.1994V16.2ZM13.1994 11.4H10.7994V6.6H13.1994V11.4ZM11.9994 23.4C13.3194 23.4 14.3994 22.32 14.3994 21H9.59941C9.59941 22.32 10.6674 23.4 11.9994 23.4Z"
      />
    </IconBase>
  );
};

export default AlertIcon;
