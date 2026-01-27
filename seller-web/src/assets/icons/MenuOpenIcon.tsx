import * as React from "react"
import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const MenuOpenIcon = ({ width = 12, height = 12, color = "#8492A6", ...props }: IProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M2.75 4.75h18.5M2.75 12h18.5m-18.5 7.25h18.5"
    />
  </svg>
)
export default MenuOpenIcon
