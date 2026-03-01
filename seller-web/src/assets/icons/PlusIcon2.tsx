import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const PlusIcon2 = ({ width = 10, height = 10, color = "#14AE5C", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 10 10"
      {...props}
    >
      <path
        fill={color}
        d="M3.75 2.083a.833.833 0 0 1 .833-.833h.834a.833.833 0 0 1 .833.833V3.75h1.667a.833.833 0 0 1 .833.833v.834a.833.833 0 0 1-.833.833H6.25v1.667a.833.833 0 0 1-.833.833h-.834a.833.833 0 0 1-.833-.833V6.25H2.083a.833.833 0 0 1-.833-.833v-.834a.833.833 0 0 1 .833-.833H3.75z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default PlusIcon2;
