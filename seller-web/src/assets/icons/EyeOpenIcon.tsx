import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

const EyeOpenIcon = ({ width = 18, height = 18, color = "#fff", className = "mdi:eye", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={className}
      viewBox="0 0 18 18"
      {...props}
    >
      <path
        fill={color}
        d="M9 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5m0 6a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5m0-9.375C5.25 3.375 2.047 5.707.75 9c1.297 3.293 4.5 5.625 8.25 5.625S15.953 12.293 17.25 9C15.953 5.707 12.75 3.375 9 3.375"
      />
    </svg>
  );
};

export default EyeOpenIcon;
