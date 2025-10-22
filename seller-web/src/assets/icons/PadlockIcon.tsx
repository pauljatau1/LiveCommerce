import * as React from "react"
import { SVGProps } from "react"

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
}

const PadlockIcon = (props: IProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width || 60}
    height={props.height || 60}
    fill="none"
    {...props}
  >
    <path fill="#27272E" d="M0 60h60V0H0z" />
  </svg>
)
export default PadlockIcon
