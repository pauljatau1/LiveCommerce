import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const StateIcon = ({ width = 16, height = 16, color = "#425466", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill={color}
        d="M8 5.333a2.666 2.666 0 1 0 0 5.334 2.666 2.666 0 1 0 0-5.334m5.96 2A5.996 5.996 0 0 0 8.665 2.04V.667H7.333V2.04a5.996 5.996 0 0 0-5.294 5.293H.666v1.334h1.373a5.996 5.996 0 0 0 5.294 5.293v1.373h1.333V13.96a5.996 5.996 0 0 0 5.293-5.293h1.374V7.333zM8 12.667A4.663 4.663 0 0 1 3.332 8a4.663 4.663 0 0 1 4.666-4.667A4.663 4.663 0 0 1 12.666 8a4.663 4.663 0 0 1-4.667 4.667"
      />
    </svg>
  );
};

export default StateIcon;
