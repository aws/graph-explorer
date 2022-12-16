import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const EdgeIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.57933 7.16506C8.84764 6.6699 9 6.10274 9 5.5C9 3.567 7.433 2 5.5 2C3.567 2 2 3.567 2 5.5C2 7.433 3.567 9 5.5 9C6.10277 9 6.66996 8.84762 7.16514 8.57929L15.4207 16.8349C15.1524 17.33 15 17.8972 15 18.5C15 20.433 16.567 22 18.5 22C20.433 22 22 20.433 22 18.5C22 16.567 20.433 15 18.5 15C17.8973 15 17.3301 15.1524 16.8349 15.4207L8.57933 7.16506ZM5.5 7C6.32843 7 7 6.32843 7 5.5C7 4.67157 6.32843 4 5.5 4C4.67157 4 4 4.67157 4 5.5C4 6.32843 4.67157 7 5.5 7ZM18.5 20C19.3284 20 20 19.3284 20 18.5C20 17.6716 19.3284 17 18.5 17C17.6716 17 17 17.6716 17 18.5C17 19.3284 17.6716 20 18.5 20Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default EdgeIcon;
