import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    color?: string;
    width?: number;
    height?: number;
    className?: string;
}

const CalendarIcon = ({ color = "#555E67", width = 14, height = 14, className = "", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={className}
      viewBox="0 0 14 14"
      {...props}
    >
      <path
        stroke={color}
        d="M1.5 2a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-2M.5 5.5h13m-10-5v3m7-3v3M3.5 2h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CalendarIcon;
