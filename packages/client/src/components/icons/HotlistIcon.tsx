import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const HotlistIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M18 8H2V11H18V8Z" fill="currentColor" />
      <path d="M18 3H2V6H18V3Z" fill="currentColor" />
      <path d="M11 13H2V16H11V13Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.04 13.1505C20.04 11.7393 19.5312 10 19.5312 10C22.2194 12.0544 24 15.2114 24 18.7492C24 21.6503 21.5387 24 18.5 24C15.4613 24 13 21.6503 13 18.7492C13 16.5307 13.8319 14.4895 15.2206 12.9142L15.2 13.1505C15.2 14.5026 16.2725 15.5987 17.6956 15.5987C19.1119 15.5987 20.04 14.5026 20.04 13.1505ZM16.0869 19.97C16.0869 21.112 17.0769 22.0309 18.3006 22.0309C20.1225 22.0309 21.6006 20.6198 21.6006 18.8805C21.6006 17.9681 21.4631 17.0755 21.195 16.2288C20.4937 17.128 19.2356 17.6859 18.0187 17.9222C16.8088 18.1585 16.0869 18.9067 16.0869 19.97Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default HotlistIcon;
