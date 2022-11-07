import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SlidesIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M15.96 10.1133L13.21 13.967L11.25 11.3979L8.5 15.2407H19.5L15.96 10.1133ZM3 4.35449H1V21.7725C1 22.9699 1.9 23.9497 3 23.9497H19V21.7725H3V4.35449ZM21 0H7C5.9 0 5 0.979761 5 2.17725V17.418C5 18.6155 5.9 19.5952 7 19.5952H21C22.1 19.5952 23 18.6155 23 17.418V2.17725C23 0.979761 22.1 0 21 0ZM21 17.418H7V2.17725H21V17.418Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default SlidesIcon;
