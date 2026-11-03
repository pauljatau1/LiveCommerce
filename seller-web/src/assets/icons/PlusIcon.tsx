import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const PlusIcon = ({ width = 10, height = 10, color = "#fff", ...props }: IProps) => {
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
        d="M8.667 5.333H5.333v3.334a.667.667 0 1 1-1.333 0V5.333H.667A.667.667 0 1 1 .667 4H4V.667a.667.667 0 0 1 1.333 0V4h3.334a.667.667 0 0 1 0 1.333"
      />
    </svg>
  );
};

export default PlusIcon;
