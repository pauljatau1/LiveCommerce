import * as React from "react"
import { SVGProps } from "react"

const NigerianFlagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={34}
    height={34}
    fill="none"
    {...props}
  >
    <g clipPath="url(#a)">
      <path
        fill="#009A49"
        d="M3.778 4.722A3.78 3.78 0 0 0 0 8.5v17a3.78 3.78 0 0 0 3.778 3.778h7.555V4.722z"
      />
      <path fill="#EEE" d="M11.334 4.722h11.333v24.556H11.334z" />
      <path
        fill="#009A49"
        d="M30.222 4.722h-7.556v24.556h7.556A3.78 3.78 0 0 0 34 25.5v-17a3.78 3.78 0 0 0-3.778-3.778"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h34v34H0z" />
      </clipPath>
    </defs>
  </svg>
)
export default NigerianFlagIcon
