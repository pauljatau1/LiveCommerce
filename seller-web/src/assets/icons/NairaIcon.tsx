import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const NairaIcon = ({ width = 16, height = 16, color = "#757575", ...props }: IProps) => {   
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className="tabler:currency-naira"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        stroke={color}
        d="M4.666 12V4.701a.7.7 0 0 1 1.312-.34l4.043 7.278a.7.7 0 0 0 1.312-.34V4m-8 2.667h9.333M3.333 9.333h9.333"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.333"
      />
    </svg>
  );
};

export default NairaIcon;
