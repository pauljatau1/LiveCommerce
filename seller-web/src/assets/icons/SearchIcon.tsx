import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const SearchIcon = ({ width = 10, height = 10, color = "#fff", ...props }: IProps) => {
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
        d="M6.453 7.16a4 4 0 1 1 .707-.707l2.694 2.693a.5.5 0 0 1-.708.708zM7 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default SearchIcon;
