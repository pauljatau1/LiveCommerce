import { type SVGProps } from "react";

interface IProps extends SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    color?: string;
}

const WarningIcon = ({ width = 12, height = 12, color = "#FFD60A", ...props }: IProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      className={props.className}
      viewBox="0 0 19 16"
      {...props}
    >
      <path
        fill={color}
        d="M0 15.833 9.167 0l9.166 15.833zm9.167-2.5q.354 0 .593-.24.24-.239.24-.593a.8.8 0 0 0-.24-.594.8.8 0 0 0-.593-.24.8.8 0 0 0-.594.24.8.8 0 0 0-.24.594q0 .354.24.594t.594.24m-.834-2.5H10V6.667H8.333z"
      />
    </svg>
  );
};

export default WarningIcon;
