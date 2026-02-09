import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

const EmptyActivityIcon = ({ width = 16, height = 16, color = "#A9A9A9", className = "lucide:activity", strokeWidth = 9, ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={className}
      viewBox="0 0 88 88"
      {...props}
    >
      <path
        stroke={color}
        d="M89 44H77.84a9 9 0 0 0-8.685 6.57L58.58 88.19a1.125 1.125 0 0 1-2.16 0L31.58-.19a1.125 1.125 0 0 0-2.16 0L18.845 37.43a9 9 0 0 1-8.64 6.57H-1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default EmptyActivityIcon;
