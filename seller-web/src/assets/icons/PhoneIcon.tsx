import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const PhoneIcon = ({ width = 12, height = 12, color = "#272D30", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 12 12"
      {...props}
    >
      <path
        fill={color}
        stroke={color}
        d="M4 1.5c.25 0 1.25 2.25 1.25 2.5 0 .5-.75 1-1 1.5S4.5 6.5 5 7c.195.195 1 1 1.5.75s1-1 1.5-1c.25 0 2.5 1 2.5 1.25 0 1-.75 1.75-1.5 2s-1.25.25-2.25 0-1.75-.5-3-1.75-1.5-2-1.75-3S1.75 3.75 2 3s1-1.5 2-1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PhoneIcon;
