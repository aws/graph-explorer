import * as React from "react"
import { SVGProps } from "react"

import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ApothecaLogo = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M0 16q0 3.264 1.28 6.208t3.392 5.12 5.12 3.424 6.208 1.248 6.208-1.248 5.12-3.424 3.392-5.12 1.28-6.208-1.28-6.208-3.392-5.12-5.088-3.392-6.24-1.28q-3.264 0-6.208 1.28t-5.12 3.392-3.392 5.12-1.28 6.208zM4 16q0-3.264 1.6-6.016t4.384-4.352 6.016-1.632 6.016 1.632 4.384 4.352 1.6 6.016-1.6 6.048-4.384 4.352-6.016 1.6-6.016-1.6-4.384-4.352-1.6-6.048z"
      />
    </IconBase>
  );
};

export default ApothecaLogo



/*
function Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1000"
      height="1000"
      viewBox="0 0 1000 1000"
    >
      <rect width="100%" height="100%" fill="rgba(255,255,255,0)"></rect>
      <g transform="translate(500 500) scale(23.9201)">
        <linearGradient
          id="SVGID_2"
          x1="15.099"
          x2="15.099"
          y1="-0.922"
          y2="40.821"
          gradientTransform="rotate(45.001 31.63 -8.252)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4CC0C7"></stop>
          <stop offset="15.417%" stopColor="#47B9C5"></stop>
          <stop offset="37.274%" stopColor="#3BA7C0"></stop>
          <stop offset="62.977%" stopColor="#2688B9"></stop>
          <stop offset="91.393%" stopColor="#0A5EAE"></stop>
          <stop offset="100%" stopColor="#0050AA"></stop>
        </linearGradient>
        <circle
          style={{ isCustomFont: "none", fontFileUrl: "none" }}
          r="18.372"
          fill="none"
          stroke="url(#SVGID_2)"
          strokeMiterlimit="10"
          strokeWidth="5"
        ></circle>
      </g>
    </svg>
  );
}

export default Icon;

<svg fill="#000000" width="64px" height="64px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>circle</title> <path d="M0 16q0 3.264 1.28 6.208t3.392 5.12 5.12 3.424 6.208 1.248 6.208-1.248 5.12-3.424 3.392-5.12 1.28-6.208-1.28-6.208-3.392-5.12-5.088-3.392-6.24-1.28q-3.264 0-6.208 1.28t-5.12 3.392-3.392 5.12-1.28 6.208zM4 16q0-3.264 1.6-6.016t4.384-4.352 6.016-1.632 6.016 1.632 4.384 4.352 1.6 6.016-1.6 6.048-4.384 4.352-6.016 1.6-6.016-1.6-4.384-4.352-1.6-6.048z"></path> </g></svg>
*/