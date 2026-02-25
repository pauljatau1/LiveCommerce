import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const FilterIcon = ({ width = 16, height = 16, color = "#454545", ...props }: IProps) => {
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
        d="M14.667 12.404a.5.5 0 0 1-.5.5h-3.4a1.953 1.953 0 0 1-3.773 0h-5.16a.5.5 0 0 1 0-1h5.16a1.953 1.953 0 0 1 3.773 0h3.4a.5.5 0 0 1 .5.5m0-8.807a.5.5 0 0 1-.5.5h-1.633a1.954 1.954 0 0 1-3.773 0H1.834a.5.5 0 1 1 0-1h6.927a1.953 1.953 0 0 1 3.773 0h1.633a.494.494 0 0 1 .5.5m0 4.4a.493.493 0 0 1-.5.5h-7.8a1.953 1.953 0 0 1-3.773 0h-.76a.5.5 0 1 1 0-1h.76a1.953 1.953 0 0 1 3.773 0h7.8a.5.5 0 0 1 .5.5"
      />
    </svg>
  );
};

export default FilterIcon;
