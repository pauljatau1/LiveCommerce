import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const CityIcon = ({ width = 16, height = 16, color = "#425466", ...props }: IProps) => {
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
        d="M13.653 5.013c.81-1.7-.965-3.476-2.666-2.666L3.214 6.048c-1.593.759-1.494 3.06.158 3.679l1.826.684a.67.67 0 0 1 .39.39l.685 1.827c.62 1.652 2.92 1.75 3.679.157z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default CityIcon;
